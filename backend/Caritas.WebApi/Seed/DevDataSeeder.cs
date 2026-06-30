using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.WebApi.Seed;

// Dados de exemplo APENAS para desenvolvimento, para exercitar manualmente os módulos de
// Estoque / Doação / Cesta / Entrega (e os componentes de UX padronizados). Cada seção é
// idempotente de forma independente, de modo que rodar de novo (mesmo com dados parciais) só
// completa o que falta — sem violar restrições de unicidade.
public static class DevDataSeeder
{
    public static async Task SeedAsync(CaritasDbContext db)
    {
        var paroquia = await db.Paroquias.FirstOrDefaultAsync(p => p.Raiz);
        if (paroquia is null) return;
        var pid = paroquia.Id;

        // ── Doadores ─────────────────────────────────────────────────────────────
        if (!await db.Doadores.AnyAsync())
        {
            db.Doadores.AddRange(
                new Doador
                {
                    Nome = "Padaria São José",
                    Documento = "12.345.678/0001-90",
                    Telefone = "(54) 3221-0001",
                },
                new Doador
                {
                    Nome = "Maria da Silva",
                    Documento = "123.456.789-00",
                    Telefone = "(54) 99999-0002",
                },
                new Doador { Nome = "Supermercado Central" });
            await db.SaveChangesAsync();
        }

        // ── Roupas (catálogo) ──────────────────────────────────────────────────────
        var roupasSeed = new[]
        {
            new Roupa
            {
                Descricao = "Camiseta branca",
                Categoria = CategoriaRoupa.Camisa,
                Genero = Genero.Unissex,
                FaixaEtaria = FaixaEtaria.Adulto,
                Tamanho = "M",
                Estacao = Estacao.Verao,
                Condicao = CondicaoRoupa.Usado,
            },
            new Roupa
            {
                Descricao = "Calça jeans",
                Categoria = CategoriaRoupa.Calca,
                Genero = Genero.Masculino,
                FaixaEtaria = FaixaEtaria.Adulto,
                Tamanho = "42",
                Condicao = CondicaoRoupa.Usado,
            },
            new Roupa
            {
                Descricao = "Casaco infantil",
                Categoria = CategoriaRoupa.Casaco,
                Genero = Genero.Unissex,
                FaixaEtaria = FaixaEtaria.Infantil,
                Tamanho = "8",
                Estacao = Estacao.Inverno,
                Condicao = CondicaoRoupa.Novo,
            },
        };
        var roupasExistentes = await db.Roupas.Select(r => r.Descricao).ToListAsync();
        var roupasNovas = roupasSeed.Where(r => !roupasExistentes.Contains(r.Descricao)).ToList();
        if (roupasNovas.Count > 0)
        {
            db.Roupas.AddRange(roupasNovas);
            await db.SaveChangesAsync();
        }

        // ── Estoque (entradas) — só se a paróquia ainda não tem posições ─────────────
        if (!await db.Estoques.AnyAsync(e => e.IdParoquia == pid))
        {
            var alimentos = await db.Alimentos.ToDictionaryAsync(a => a.Descricao, a => a.Id);
            var roupas = await db.Roupas.ToDictionaryAsync(r => r.Descricao, r => r.Id);
            var hoje = DateOnly.FromDateTime(DateTime.UtcNow);

            // Registra uma entrada consistente: ledger (Movimentacao) + projeção (Estoque).
            void Entrada(int idItem, int? tamanho, DateOnly? validade, string? lote, int qtd)
            {
                db.Movimentacoes.Add(new MovimentacaoEstoque
                {
                    IdItem = idItem,
                    IdParoquia = pid,
                    Tamanho = tamanho,
                    Validade = validade,
                    Lote = lote,
                    TipoOperacao = TipoOperacao.Entrada,
                    Quantidade = qtd,
                    OrigemTipo = OrigemMovimentacao.Ajuste,
                });
                db.Estoques.Add(new Estoque
                {
                    IdItem = idItem,
                    IdParoquia = pid,
                    Tamanho = tamanho,
                    Validade = validade,
                    Lote = lote,
                    Quantidade = qtd,
                });
            }

            // Alimentos: tamanho em unidade-base (g/ml/un).
            if (alimentos.TryGetValue("Arroz", out var arroz))
                Entrada(arroz, 1000, hoje.AddDays(180), "L-ARROZ-01", 50);
            if (alimentos.TryGetValue("Feijão", out var feijao))
                Entrada(feijao, 1000, hoje.AddDays(150), "L-FEIJAO-01", 30);
            if (alimentos.TryGetValue("Óleo", out var oleo))
                Entrada(oleo, 900, hoje.AddDays(365), null, 20);
            if (alimentos.TryGetValue("Leite", out var leite))
                Entrada(leite, 1000, hoje.AddDays(20), "L-LEITE-01", 15); // perto de vencer
            if (alimentos.TryGetValue("Ovo", out var ovo))
                Entrada(ovo, 12, hoje.AddDays(25), null, 10);
            // Roupas: sem tamanho/validade (contagem de peças).
            if (roupas.TryGetValue("Camiseta branca", out var camiseta))
                Entrada(camiseta, null, null, null, 12);
            if (roupas.TryGetValue("Calça jeans", out var calca))
                Entrada(calca, null, null, null, 8);
            if (roupas.TryGetValue("Casaco infantil", out var casaco))
                Entrada(casaco, null, null, null, 6);

            await db.SaveChangesAsync();
        }

        // ── Configuração de cesta ────────────────────────────────────────────────
        const string nomeConfig = "Cesta Básica Padrão";
        if (!await db.ConfiguracoesCesta.AnyAsync(c => c.Nome == nomeConfig && c.IdParoquia == pid))
        {
            var alimentos = await db.Alimentos.ToDictionaryAsync(a => a.Descricao, a => a.Id);
            var itens = new List<ItemConfiguracaoCesta>();
            if (alimentos.TryGetValue("Arroz", out var arroz))
                itens.Add(new() { IdAlimento = arroz, Tamanho = 1000, QuantidadePacotes = 2 });
            if (alimentos.TryGetValue("Feijão", out var feijao))
                itens.Add(new() { IdAlimento = feijao, Tamanho = 1000, QuantidadePacotes = 1 });
            if (alimentos.TryGetValue("Óleo", out var oleo))
                itens.Add(new() { IdAlimento = oleo, Tamanho = 900, QuantidadePacotes = 1 });

            if (itens.Count > 0)
            {
                db.ConfiguracoesCesta.Add(new ConfiguracaoCesta
                {
                    Nome = nomeConfig,
                    IdParoquia = pid,
                    Itens = itens,
                });
                await db.SaveChangesAsync();
            }
        }

        // ── Família (para testar Entregas) — só se a paróquia ainda não tem famílias ──
        if (!await db.Familias.AnyAsync(f => f.ParoquiaId == pid))
        {
            // FamiliaCidade tem nome único: reaproveita a existente se houver.
            var cidade = await db.FamiliaCidades.FirstOrDefaultAsync(c => c.Nome == "Caxias do Sul");
            if (cidade is null)
            {
                cidade = new FamiliaCidade { Nome = "Caxias do Sul" };
                db.FamiliaCidades.Add(cidade);
                await db.SaveChangesAsync();
            }

            var responsavel = new Pessoa
            {
                Nome = "João dos Santos",
                DataNascimento = new DateOnly(1985, 5, 12),
                Telefone = "(54) 98888-0003",
            };
            db.Pessoas.Add(responsavel);
            await db.SaveChangesAsync();

            var familia = new Familia
            {
                ParoquiaId = pid,
                ResponsavelId = responsavel.Id,
                CidadeId = cidade.Id,
                RendaFamiliar = 1200m,
                SituacaoMoradia = SituacaoMoradia.Alugada,
                Vulnerabilidade = Vulnerabilidade.InsegurancaAlimentar,
                Rua = "Rua das Flores",
                Numero = "123",
                Bairro = "Centro",
                Cep = "95010-000",
            };
            db.Familias.Add(familia);
            responsavel.Familia = familia;
            await db.SaveChangesAsync();
        }
    }
}
