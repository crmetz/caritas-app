# Deploy em VM com Docker

Guia para subir as três camadas (frontend, backend, PostgreSQL) numa VM Linux.

## Arquitetura do deploy

Apenas o container do frontend é publicado. Ele roda nginx, serve os arquivos
estáticos do `vite build` e faz proxy de `/api` para o backend pela rede interna
do Docker:

```
Internet → :8081 da VM → container frontend (nginx)
                           ├─ /      → /usr/share/nginx/html (SPA React)
                           └─ /api/  → http://backend:8080
                                          └─ postgres:5432
```

A porta publicada vem de `APP_PORT` no `.env` (padrão `8081`). **Não use 80/443**: a
VM de deploy é compartilhada com um servidor de e-mail (mailcow) que já ocupa as duas.

Backend e PostgreSQL **não são acessíveis de fora da VM**. Como o frontend e a API
respondem na mesma origem, não há CORS nem preflight, e o `VITE_API_URL` fica
vazio (chamadas relativas) — trocar o IP ou o domínio da VM **não exige rebuild**.

## Arquivos envolvidos

| Arquivo | Papel |
|---|---|
| `docker-compose.prod.yml` | Stack de produção (fica na raiz de propósito — veja abaixo) |
| `.env.example` | Modelo das variáveis; copiar para `.env` na VM |
| `frontend/Dockerfile` | Build multi-stage: node → nginx |
| `frontend/nginx.conf` | Serve o SPA e faz proxy de `/api` |
| `backend/Caritas.WebApi/Dockerfile` | Imagem da API (já existia) |
| `backend/.dockerignore`, `frontend/.dockerignore` | Mantêm o contexto de build enxuto |
| `.github/workflows/deploy.yml` | Pipeline: build das imagens no GitHub, deploy por SSH |

O compose de produção fica na **raiz**, não em `backend/`. Isso é intencional: rodar
o Compose de dentro de `backend/` carregaria automaticamente o
`backend/docker-compose.override.yml`, que é de desenvolvimento (força
`ASPNETCORE_ENVIRONMENT=Development`, publica o Postgres no host e monta caminhos
`${APPDATA}` que só existem no Windows).

Os arquivos de dev (`backend/docker-compose.yml` e o `.override.yml`) continuam
funcionando normalmente e não foram alterados.

## Preparar a VM

Instalar o Docker Engine + plugin Compose (Ubuntu/Debian):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # reabrir a sessão SSH depois disso
```

Conferir que a porta escolhida está livre antes de subir a stack:

```bash
ss -tulpn | grep -E ':8081|:8080'   # não pode retornar nada
```

Liberar a porta no firewall da VM **e** no firewall do provedor, se houver:

```bash
sudo ufw allow 8081/tcp
```

Requisitos: ~2 GB de RAM livres para o build (SDK .NET + `npm ci` rodam na VM).


### VM compartilhada (importante)

O servidor de deploy atual (`177.104.188.217`, Ubuntu 24.04, 2 vCPU / 4 GB) **também roda
um servidor de e-mail de produção (mailcow) administrado por terceiros**. Consequências:

- **80 e 443 são do mailcow.** A stack publica só `APP_PORT` (porta alta).
- **RAM é escassa.** O compose define `mem_limit` em todos os serviços para que um pico
  da aplicação não mate os containers do mailcow por OOM. Não remova esses limites.
- **Build na VM é o principal risco de OOM** (o SDK .NET sozinho passa de 1 GB). Com swap
  configurado costuma passar; se travar, buildar fora da VM (ver "Build fora da VM").
- Os containers têm nome prefixado (`caritas-*`) para não colidir com os do mailcow.

### Build fora da VM (alternativa)

Se o build na VM ficar inviável, buildar na máquina local e enviar as imagens:

```bash
docker build -t caritas-backend ./backend -f backend/Caritas.WebApi/Dockerfile
docker save caritas-backend | ssh -i xplay.pem xplay@177.104.188.217 "docker load"
# idem para o frontend; no compose da VM, trocar "build:" por "image: caritas-backend"
```

Na Fase 2 (CI/CD) esse dilema some: o GitHub Actions builda, publica no GHCR e a VM só
faz `docker compose pull`.

## Primeiro deploy

```bash
git clone <url-do-repo> caritas
cd caritas

cp .env.example .env
nano .env        # ver "O que preencher no .env" abaixo

docker compose -f docker-compose.prod.yml up -d --build
```

### O que preencher no `.env`

| Variável | Observação |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -base64 24` |
| `JWT_KEY` | `openssl rand -base64 48`. **Obrigatório** — sem ele a API lança `Jwt:Key não configurado.` e o container entra em restart loop |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Admin inicial, só no primeiro deploy (veja abaixo) |
| `APP_PORT` | Porta publicada na VM (padrão `8081`). Nunca 80/443 — são do mailcow |
| `FRONTEND_URL` | URL pública **com a porta**, sem barra no final (ex.: `http://177.104.188.217:8081`). Usada nos links de recuperação de senha |
| `SMTP_*` | Credenciais de envio de e-mail |

### Admin inicial

O admin é criado no startup apenas se **não existir nenhum admin ativo** no banco e as
duas variáveis estiverem preenchidas. A senha precisa passar nas regras do Identity:
mínimo 8 caracteres, com pelo menos um dígito e uma letra maiúscula — se for recusada,
o log mostra `Falha ao criar o usuário admin de seed` com o motivo.

**Depois do primeiro deploy, esvazie as duas variáveis** e recrie o container:

```bash
sed -i 's/^SEED_ADMIN_EMAIL=.*/SEED_ADMIN_EMAIL=/;s/^SEED_ADMIN_PASSWORD=.*/SEED_ADMIN_PASSWORD=/' .env
docker compose -f docker-compose.prod.yml up -d backend
```

Sem elas a API só loga um warning e não cria admin nenhum; o usuário já existente no
banco é preservado. Assim a senha do admin deixa de ficar em texto claro no `.env`.

Verificar:

```bash
docker compose -f docker-compose.prod.yml ps       # 3 containers Up, postgres healthy
docker compose -f docker-compose.prod.yml logs backend
curl http://localhost:8081/health                   # {"status":"ok"}
ss -tulpn | grep 8081                               # só o docker-proxy, mailcow intacto
```

As migrations do EF são aplicadas automaticamente no startup da API — não é preciso
rodar `dotnet ef database update` manualmente.

Depois acessar `http://IP-DA-VM:8081` no navegador e entrar com as credenciais de
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Operação

```bash
cd caritas

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend

# Atualizar para a versão mais recente
git pull
docker compose -f docker-compose.prod.yml up -d --build

# Reiniciar / parar
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml down          # preserva o volume do banco

# Limpar imagens antigas depois de vários rebuilds
docker image prune -f
```

> **Nunca rode `docker system prune -a` nesta VM.** Ele apaga imagens de *todos* os
> projetos do host — inclusive as do mailcow, que não são reconstruídas por nós.
> `docker image prune -f` (sem `-a`) remove só camadas órfãs e é seguro.

## Deploy pela pipeline (GitHub Actions)

O workflow [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) é disparado
**manualmente**, e só a partir da `main`:

```
Run workflow (main) → runner do GitHub builda as duas imagens → publica no GHCR
                                                                    ↓
                                  job de deploy entra por SSH na VM: git pull,
                                  docker compose pull + up -d, health check
```

Não há gatilho por push: merge na `main` não coloca nada no ar sozinho. Quem decide a
hora do deploy é você.

```bash
gh workflow run deploy.yml          # ou Actions -> Deploy -> Run workflow
gh run watch
```

O disparo aceita qualquer branch na interface, mas o primeiro passo de cada job falha se
a origem não for a `main`.

O build **não** acontece na VM. Ela tem 4 GB divididos com um servidor de e-mail; o runner
do GitHub é gratuito e ilimitado em repositório público, então compilar lá é de graça e
não arrisca o host. A VM só baixa imagem pronta.

O job de build também faz o papel de CI: o `Dockerfile` do frontend roda `tsc` antes do
Vite e o do backend compila a solução inteira. Erro de tipo ou de compilação derruba o
build, e o job de deploy nem começa — a versão no ar continua intacta.

### Secrets a cadastrar

Em *Settings → Secrets and variables → Actions*:

| Secret | Valor |
|---|---|
| `SSH_HOST` | IP da VM |
| `SSH_USER` | Usuário do deploy (precisa estar no grupo `docker`) |
| `SSH_KEY` | Chave **privada** completa, incluindo as linhas `BEGIN`/`END` |
| `SSH_PORT` | Só se o SSH não estiver na 22 |

O `GITHUB_TOKEN` usado para publicar e baixar as imagens é gerado automaticamente a cada
execução — não precisa cadastrar nada para o GHCR.

### Chave de deploy dedicada

Não use a chave root do provedor no pipeline. Gere um par exclusivo, sem senha (o
workflow não tem como digitar uma):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/caritas-deploy -C "github-actions-caritas" -N ""
ssh-copy-id -i ~/.ssh/caritas-deploy.pub xplay@177.104.188.217
```

O conteúdo de `~/.ssh/caritas-deploy` (a privada) vai para o secret `SSH_KEY`. Se depois
a XPLAY criar um usuário sem sudo só para o deploy, basta trocar `SSH_USER` — o workflow
não muda.

### Pré-requisitos na VM

O deploy pela pipeline assume o que o deploy manual já deixou pronto:

- repositório clonado em `~/app/caritas` (o caminho está fixo no workflow);
- `.env` preenchido ao lado do compose;
- usuário do SSH no grupo `docker`, para rodar `docker` sem `sudo`.

### Rollback

Toda imagem recebe duas tags: `latest` e o SHA do commit. Depois de um deploy bem
sucedido, a VM grava o SHA em `.last-good-tag`.

- **Automático:** se o `/health` não responder em 150 s, o workflow sobe de volta a última
  versão boa, despeja os logs do backend no output e falha.
- **Manual:** *Actions → Deploy → Run workflow*, preenchendo `image_tag` com o SHA
  desejado. Com esse campo preenchido o build é pulado e a VM só troca a imagem.

### Cuidados

- O script roda `git reset --hard origin/main` na VM: qualquer alteração feita à mão em
  arquivo **versionado** lá é descartada. O `.env` não é versionado e sobrevive.
- **As migrations do EF rodam no startup da API**, então todo deploy aplica no banco de
  produção o que estiver pendente. Enquanto não houver rotina de backup, uma migration
  destrutiva é irreversível — confira o que está indo junto antes de disparar.
- Quem tem permissão de escrita no repositório consegue, via workflow, executar comandos
  na VM. Pull requests de forks não têm acesso a secrets, mas vale proteger a `main`.

## Segurança

**Não há mais credenciais fixas no código.** O admin inicial vem de
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, e sem essas variáveis nenhum admin é
criado. Esvazie as duas depois do primeiro deploy.

**Rate limiting** está ativo em `/api/auth/login`, `/forgot-password` e
`/reset-password`: 10 requisições por minuto **por IP de origem**, com resposta
`429 Too Many Requests` acima disso. O particionamento por IP real depende do
`X-Forwarded-For` que o nginx envia e do `UseForwardedHeaders()` no backend — se
esse encadeamento for alterado, todos os clientes passam a compartilhar o mesmo
limite e um único atacante derruba o login de todo mundo.

### Pendência: tráfego em HTTP

O token JWT trafega em texto claro entre navegador e VM. Com um IP público isso
atravessa a internet aberta, então **TLS é a próxima prioridade**.

Nesta VM o caminho normal (certbot na 80/443) **não está disponível**: as duas portas são
do mailcow, e o certbot em modo standalone precisaria pará-lo. As opções realistas são:

1. Pedir à XPLAY que o nginx do mailcow faça reverse proxy de um subdomínio para
   `127.0.0.1:8081` — o mailcow já tem certificado Let's Encrypt e renovação automática.
2. Emitir o certificado por DNS-01 (sem tocar nas portas) e terminar TLS no nosso próprio
   nginx: `server` block na 443 com `ssl_certificate`, certificados montados por volume no
   serviço `frontend`, porta 443 publicada — o que também esbarra no mailcow.

A opção 1 é a menos invasiva. Em qualquer caso nada muda no backend: ele não faz
`UseHttpsRedirection`, então TLS é responsabilidade exclusiva do nginx.

## Notas

- **Swagger não existe em produção** — é registrado apenas quando
  `ASPNETCORE_ENVIRONMENT=Development`.
- **Dados de exemplo (`DevDataSeeder`) não rodam em produção** pelo mesmo motivo. Já os
  seeds de alimentos, diocese raiz e perfil Admin rodam sempre, e são idempotentes.
- **`FRONTEND_URL` precisa ser a URL pública real.** Ela monta o link dos e-mails de
  recuperação de senha (`AuthController.ForgotPassword`). Se ficar vazia, o link cai no
  fallback `http://localhost:5173` e os usuários recebem um endereço que não abre.
- **A política de CORS continua `AllowAnyOrigin`.** Ela deixa de ser exercitada nesta
  topologia (mesma origem) e o backend não fica exposto publicamente; restringi-la
  quebraria o desenvolvimento local (Vite na 5173 → API na 8080).
- **`npm run build` roda `tsc` antes do Vite**, então um erro de tipo derruba o build da
  imagem do frontend. Rodar `npm run typecheck` em `frontend/` antes de deployar.
