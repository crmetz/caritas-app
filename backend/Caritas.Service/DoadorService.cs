using Caritas.Models.DTOs.Doador;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class DoadorService(IDoadorRepository doadorRepository) : IDoadorService
{
    public async Task<PagedResponseDto<DoadorResponseDto>> GetPagedAsync(int page, int pageSize)
    {
        var paged = await doadorRepository.GetPagedAsync(page, pageSize);
        return new() { Items = paged.Items.Select(d => d.ToResponseDto()), TotalCount = paged.TotalCount };
    }

    public async Task<DoadorResponseDto> GetByIdAsync(int id)
    {
        var doador = await doadorRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Doador com id {id} não encontrado.");
        return doador.ToResponseDto();
    }

    public async Task<DoadorResponseDto> CreateAsync(DoadorCreateDto dto)
        => (await doadorRepository.AddAsync(dto.ToEntity())).ToResponseDto();

    public async Task<DoadorResponseDto> UpdateAsync(int id, DoadorUpdateDto dto)
    {
        var doador = await doadorRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Doador com id {id} não encontrado.");
        doador.Nome = dto.Nome; doador.Documento = dto.Documento; doador.Telefone = dto.Telefone;
        await doadorRepository.UpdateAsync(doador);
        return doador.ToResponseDto();
    }

    public Task DeleteAsync(int id) => doadorRepository.DeleteAsync(id);
}
