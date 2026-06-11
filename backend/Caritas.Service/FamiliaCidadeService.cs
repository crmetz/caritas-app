using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.FamiliaCidade;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class FamiliaCidadeService(CaritasDbContext context)
{
    private readonly FamiliaCidadeRepository _cidadeRepository = new(context);

    public async Task<List<SelectObjectDto>> GetAllSelectAsync()
    {
        var cidades = await _cidadeRepository.GetAllAsync();
        return cidades
            .OrderBy(c => c.Nome)
            .Select(c => c.ToSelectObjectDto())
            .ToList();
    }

    public async Task<SelectObjectDto> CreateAsync(FamiliaCidadeCreateDto dto)
    {
        var nome = dto.Nome.Trim();
        if (string.IsNullOrWhiteSpace(nome))
            throw new ArgumentException("O nome da cidade é obrigatório.");

        var existente = await _cidadeRepository.GetByNomeAsync(nome);
        if (existente is not null)
            return existente.ToSelectObjectDto();

        var cidade = await _cidadeRepository.AddAsync(dto.ToEntity());
        return cidade.ToSelectObjectDto();
    }
}
