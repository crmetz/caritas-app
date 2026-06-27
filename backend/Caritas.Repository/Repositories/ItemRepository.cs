using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class ItemRepository(CaritasDbContext context) : BaseRepository<Item>(context), IItemRepository
{
    public async Task<Alimento> AddAlimentoAsync(Alimento alimento)
    {
        await Context.Alimentos.AddAsync(alimento);
        await Context.SaveChangesAsync();
        return alimento;
    }

    public async Task<Roupa> AddRoupaAsync(Roupa roupa)
    {
        await Context.Roupas.AddAsync(roupa);
        await Context.SaveChangesAsync();
        return roupa;
    }

    public async Task<Roupa?> FindRoupaIdenticaAsync(Roupa roupa)
        => await Context.Roupas.FirstOrDefaultAsync(r =>
            r.Descricao.ToLower() == roupa.Descricao.ToLower()
            && r.Categoria == roupa.Categoria
            && r.Genero == roupa.Genero
            && r.FaixaEtaria == roupa.FaixaEtaria
            && r.Tamanho == roupa.Tamanho
            && r.Estacao == roupa.Estacao
            && r.Condicao == roupa.Condicao
            && r.Codigo == roupa.Codigo);

    public async Task<Alimento?> GetAlimentoByIdAsync(int id)
        => await Context.Alimentos.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Roupa?> GetRoupaByIdAsync(int id)
        => await Context.Roupas.FirstOrDefaultAsync(r => r.Id == id);

    public async Task UpdateAsync(Item item)
    {
        Context.Update(item);
        await Context.SaveChangesAsync();
    }

    public async Task<List<Item>> GetSelectAsync(TipoItem? tipo)
        => await DbSet.Where(i => tipo == null || i.Tipo == tipo)
                      .OrderBy(i => i.Descricao)
                      .ToListAsync();

    public async Task<List<Alimento>> GetAlimentosAsync()
        => await Context.Alimentos.OrderBy(a => a.Descricao).ToListAsync();

    public async Task<bool> AlimentoNomeExisteAsync(string descricao, int? ignoreId = null)
        => await Context.Alimentos.AnyAsync(a =>
            a.Descricao.ToLower() == descricao.ToLower() && (ignoreId == null || a.Id != ignoreId));

    // Ids de itens vinculados a estoque, movimentação ou item de configuração de cesta (não excluíveis).
    public async Task<HashSet<int>> GetItensEmUsoAsync()
    {
        var emEstoque = Context.Estoques.Select(e => e.IdItem);
        var emMovimentacao = Context.Movimentacoes.Select(m => m.IdItem);
        var emConfig = Context.ItensConfiguracaoCesta.Select(i => i.IdAlimento);
        var ids = await emEstoque.Concat(emMovimentacao).Concat(emConfig).Distinct().ToListAsync();
        return ids.ToHashSet();
    }

    public async Task<bool> ItemEmUsoAsync(int id)
        => await Context.Estoques.AnyAsync(e => e.IdItem == id)
        || await Context.Movimentacoes.AnyAsync(m => m.IdItem == id)
        || await Context.ItensConfiguracaoCesta.AnyAsync(i => i.IdAlimento == id);
}
