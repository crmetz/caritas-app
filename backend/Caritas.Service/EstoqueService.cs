using Caritas.Models.DTOs.Estoque;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class EstoqueService(IEstoqueRepository estoqueRepository, ICurrentSession session) : IEstoqueService
{
    public async Task<PagedResponseDto<EstoqueAlimentoResponseDto>> GetAlimentosAsync(
        int page, int pageSize, string? busca, DateOnly? validadeDe, DateOnly? validadeAte,
        string? sortKey, string? sortDir)
    {
        var paged = await estoqueRepository.GetAlimentosPagedAsync(
            page, pageSize, busca, validadeDe, validadeAte, sortKey, sortDir);
        return new() { Items = paged.Items.Select(e => e.ToAlimentoDto()), TotalCount = paged.TotalCount };
    }

    public Task<EstoqueAlertasDto> GetAlimentosAlertasAsync()
        => estoqueRepository.GetAlimentosAlertasAsync(DateOnly.FromDateTime(DateTime.UtcNow));

    public async Task<PagedResponseDto<EstoqueRoupaResponseDto>> GetRoupasAsync(
        int page, int pageSize, string? busca, CategoriaRoupa? categoria, CondicaoRoupa? condicao,
        string? sortKey, string? sortDir)
    {
        var paged = await estoqueRepository.GetRoupasPagedAsync(
            page, pageSize, busca, categoria, condicao, sortKey, sortDir);
        return new() { Items = paged.Items.Select(e => e.ToRoupaDto()), TotalCount = paged.TotalCount };
    }

    public async Task<List<ResumoTipoAlimentoDto>> GetResumoAlimentosAsync()
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var resumo = await estoqueRepository.GetResumoAlimentosAsync(idParoquia);
        foreach (var r in resumo)
            r.TextoFormatado = MedidaHelper.Formatar(r.TotalBase, r.FormaMedida);
        return resumo;
    }
}
