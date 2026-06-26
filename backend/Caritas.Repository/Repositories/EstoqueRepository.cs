using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class EstoqueRepository(CaritasDbContext context) : BaseRepository<Estoque>(context), IEstoqueRepository
{
    public async Task<PagedResponseDto<Estoque>> GetPagedByTipoAsync(
        TipoItem tipo, int page, int pageSize, string? busca)
    {
        // Lotes zerados (saldo aplicado a 0 após saídas) não aparecem na listagem.
        var query = DbSet.Include(e => e.Item)
                         .Where(e => e.Item.Tipo == tipo && e.Quantidade > 0);

        if (!string.IsNullOrWhiteSpace(busca))
            query = query.Where(e => EF.Functions.ILike(e.Item.Descricao, $"%{busca}%")
                                  || (e.Lote != null && EF.Functions.ILike(e.Lote, $"%{busca}%")));

        return await query.OrderBy(e => e.Validade).ThenBy(e => e.Id).ToPagedAsync(page, pageSize);
    }

    // Estoque de roupas com filtros/ordenação/paginação server-side.
    public async Task<PagedResponseDto<Estoque>> GetRoupasPagedAsync(
        int page, int pageSize, string? busca, CategoriaRoupa? categoria, CondicaoRoupa? condicao,
        string? sortKey, string? sortDir)
    {
        var joined = DbSet.Include(e => e.Item)
            .Join(Context.Roupas, e => e.IdItem, r => r.Id, (e, r) => new { e, r })
            .Where(x => x.e.Quantidade > 0);

        if (!string.IsNullOrWhiteSpace(busca))
            joined = joined.Where(x => EF.Functions.ILike(x.r.Descricao, $"%{busca}%")
                                    || (x.e.Lote != null && EF.Functions.ILike(x.e.Lote, $"%{busca}%")));
        if (categoria.HasValue) joined = joined.Where(x => x.r.Categoria == categoria.Value);
        if (condicao.HasValue) joined = joined.Where(x => x.r.Condicao == condicao.Value);

        var desc = string.Equals(sortDir, "desc", StringComparison.OrdinalIgnoreCase);
        joined = sortKey switch
        {
            "quantidade" => desc ? joined.OrderByDescending(x => x.e.Quantidade) : joined.OrderBy(x => x.e.Quantidade),
            "categoria" => desc ? joined.OrderByDescending(x => x.r.Categoria) : joined.OrderBy(x => x.r.Categoria),
            _ => desc ? joined.OrderByDescending(x => x.r.Descricao) : joined.OrderBy(x => x.r.Descricao),
        };

        return await joined.Select(x => x.e).ToPagedAsync(page, pageSize);
    }

    // Lock pessimista da linha de saldo. Deve rodar dentro de uma transação (ver MovimentacaoService).
    public async Task<Estoque?> GetByCoordsForUpdateAsync(int idItem, int idParoquia, int? tamanho, DateOnly? validade, string? lote)
    {
        var rows = await DbSet.FromSql(
            $@"SELECT * FROM ""Estoque""
               WHERE ""IdItem"" = {idItem}
                 AND ""IdParoquia"" = {idParoquia}
                 AND ""Tamanho"" IS NOT DISTINCT FROM {tamanho}
                 AND ""Validade"" IS NOT DISTINCT FROM {validade}
                 AND ""Lote"" IS NOT DISTINCT FROM {lote}
               FOR UPDATE").ToListAsync();
        return rows.FirstOrDefault();
    }

    public async Task<List<ResumoTipoAlimentoDto>> GetResumoAlimentosAsync(int idParoquia)
        => await (from e in Context.Estoques
                  join a in Context.Alimentos on e.IdItem equals a.Id
                  where e.IdParoquia == idParoquia && e.Quantidade > 0 && e.Tamanho != null
                  group new { e, a } by new { a.Id, a.Descricao, a.FormaMedida } into g
                  orderby g.Key.Descricao
                  select new ResumoTipoAlimentoDto
                  {
                      IdAlimento = g.Key.Id,
                      Nome = g.Key.Descricao,
                      FormaMedida = g.Key.FormaMedida,
                      TotalBase = g.Sum(x => (long)x.e.Quantidade * x.e.Tamanho!.Value),
                  }).ToListAsync();

    public async Task<List<Estoque>> GetLotesDisponiveisAsync(int idItem, int tamanho, int idParoquia)
        => await DbSet.Include(e => e.Item)
                      .Where(e => e.IdItem == idItem && e.IdParoquia == idParoquia
                               && e.Tamanho == tamanho && e.Quantidade > 0)
                      .OrderBy(e => e.Validade == null).ThenBy(e => e.Validade).ThenBy(e => e.Id)
                      .ToListAsync();

    public void Add(Estoque estoque) => DbSet.Add(estoque);
}
