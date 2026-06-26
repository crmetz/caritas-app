using Caritas.Models.DTOs.ConfiguracaoCesta;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class ConfiguracaoCestaService(
    IConfiguracaoCestaRepository repo,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : IConfiguracaoCestaService
{
    public async Task<ConfiguracaoCestaResponseDto> CreateAsync(ConfiguracaoCestaCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        var config = new ConfiguracaoCesta { Nome = dto.Nome, IdParoquia = idParoquia };
        foreach (var item in dto.Itens)
            config.Itens.Add(await ToItemAsync(item));

        await repo.AddAsync(config);
        return (await repo.GetByIdWithItensAsync(config.Id))!.ToResponseDto();
    }

    public async Task<ConfiguracaoCestaResponseDto> UpdateAsync(int id, ConfiguracaoCestaUpdateDto dto)
    {
        var config = await repo.GetByIdWithItensAsync(id)
            ?? throw new KeyNotFoundException($"Configuração de cesta {id} não encontrada.");

        config.Nome = dto.Nome;
        config.Itens.Clear();   // cascade remove + re-add (substituição simples das linhas)
        foreach (var item in dto.Itens)
            config.Itens.Add(await ToItemAsync(item));

        await repo.SaveAsync();
        return (await repo.GetByIdWithItensAsync(id))!.ToResponseDto();
    }

    public async Task<ConfiguracaoCestaResponseDto> GetByIdAsync(int id)
        => (await repo.GetByIdWithItensAsync(id)
            ?? throw new KeyNotFoundException($"Configuração de cesta {id} não encontrada.")).ToResponseDto();

    public async Task<PagedResponseDto<ConfiguracaoCestaResponseDto>> GetPagedAsync(int page, int pageSize)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var paged = await repo.GetPagedWithItensAsync(idParoquia, page, pageSize);
        return new() { Items = paged.Items.Select(c => c.ToResponseDto()), TotalCount = paged.TotalCount };
    }

    public Task DeleteAsync(int id) => repo.DeleteAsync(id);

    private async Task<ItemConfiguracaoCesta> ToItemAsync(ItemConfiguracaoCestaDto item) => new()
    {
        IdAlimento = item.IdAlimento,
        Tamanho = await movimentacaoService.ResolverTamanhoAsync(item.IdAlimento, item.TamanhoValor, item.TamanhoUnidade)
            ?? throw new ArgumentException("Tamanho do pacote é obrigatório na configuração de cesta."),
        QuantidadePacotes = item.QuantidadePacotes,
    };
}
