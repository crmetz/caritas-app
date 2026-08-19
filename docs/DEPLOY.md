# Deploy em VM com Docker

Guia para subir as três camadas (frontend, backend, PostgreSQL) numa VM Linux.

## Arquitetura do deploy

Apenas o container do frontend é publicado. Ele roda nginx, serve os arquivos
estáticos do `vite build` e faz proxy de `/api` para o backend pela rede interna
do Docker:

```
Internet → :80 da VM → container frontend (nginx)
                         ├─ /      → /usr/share/nginx/html (SPA React)
                         └─ /api/  → http://backend:8080
                                        └─ postgres:5432
```

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

Liberar a porta 80 no firewall da VM **e** no grupo de segurança do provedor
(AWS/Azure/GCP/Oracle têm firewall próprio, separado do `ufw`):

```bash
sudo ufw allow 80/tcp
```

Requisitos: ~2 GB de RAM livres para o build (SDK .NET + `npm ci` rodam na VM).
Se a VM tiver 1 GB, criar swap antes: `sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile`.

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
| `FRONTEND_URL` | URL pública, sem barra no final (ex.: `http://203.0.113.10`). Usada nos links de recuperação de senha |
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
curl http://localhost/health                        # {"status":"ok"}
```

As migrations do EF são aplicadas automaticamente no startup da API — não é preciso
rodar `dotnet ef database update` manualmente.

Depois acessar `http://IP-DA-VM` no navegador e entrar com as credenciais de
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

### Backup do banco

O volume `postgres_data` é o único dado que não se reconstrói a partir do repositório.

```bash
# Backup
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U caritas caritas > backup-$(date +%F).sql

# Restore
cat backup-2026-08-10.sql | docker compose -f docker-compose.prod.yml exec -T postgres \
  psql -U caritas -d caritas
```

Vale agendar no cron da VM e copiar os arquivos para fora dela.

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

Para adicionar HTTPS, o caminho mais curto é: apontar um domínio para a VM,
adicionar um `server` block na 443 no `frontend/nginx.conf` com `ssl_certificate`,
montar os certificados via volume no serviço `frontend` do compose, publicar a porta
443 e transformar o `server` da 80 em redirect. Nada do resto da stack muda — o
backend não faz `UseHttpsRedirection`, então TLS é responsabilidade exclusiva do nginx.

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
