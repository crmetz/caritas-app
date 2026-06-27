using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;

namespace Caritas.Models.Interfaces;

public interface IItemRepository : IBaseRepository<Item>
{
    Task<Alimento> AddAlimentoAsync(Alimento alimento);
    Task<Roupa> AddRoupaAsync(Roupa roupa);
    // Roupa já cadastrada com exatamente os mesmos atributos? (evita duplicar o item de catálogo a cada entrada)
    Task<Roupa?> FindRoupaIdenticaAsync(Roupa roupa);
    Task<Alimento?> GetAlimentoByIdAsync(int id);
    Task<Roupa?> GetRoupaByIdAsync(int id);
    Task UpdateAsync(Item item);                 // atualiza subtipo já rastreado
    Task<List<Item>> GetSelectAsync(TipoItem? tipo);
    Task<List<Alimento>> GetAlimentosAsync();    // catálogo de gêneros, ordenado por nome
    // Já existe um gênero de alimento com este nome? (unicidade no service, pois Descricao mora em Item sob TPT)
    Task<bool> AlimentoNomeExisteAsync(string descricao, int? ignoreId = null);
    Task<HashSet<int>> GetItensEmUsoAsync();     // ids vinculados a estoque/movimentação/cesta
    Task<bool> ItemEmUsoAsync(int id);
}
