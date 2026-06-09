using Caritas.Models.DTOs.Familia;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class FamiliaMapper
{
    public static FamiliaResponseDto ToResponseDto(this Familia f) => new()
    {
        Id = f.Id,
        ParoquiaId = f.ParoquiaId,
        ParoquiaNome = f.Paroquia?.Nome ?? string.Empty,
        ResponsavelId = f.ResponsavelId,
        Responsavel = f.Responsavel?.ToResponseDto(),
        Membros = f.Membros?
            .Where(p => p.Id != f.ResponsavelId)
            .Select(p => p.ToResponseDto()) ?? [],
        RendaFamiliar = f.RendaFamiliar,
        SituacaoMoradia = f.SituacaoMoradia,
        Vulnerabilidade = f.Vulnerabilidade,
        Observacoes = f.Observacoes,
        Rua = f.Rua,
        Numero = f.Numero,
        Complemento = f.Complemento,
        Bairro = f.Bairro,
        Cidade = f.Cidade,
        Estado = f.Estado,
        Cep = f.Cep,
        CriadoEm = f.CriadoEm,
        AtualizadoEm = f.AtualizadoEm,
    };
}
