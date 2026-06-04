using Caritas.Models.DTOs.Pessoa;
using Caritas.Models.Entities;

namespace Caritas.Service.Mappers;

public static class PessoaMapper
{
    public static PessoaResponseDto ToResponseDto(this Pessoa p) => new()
    {
        Id = p.Id,
        Nome = p.Nome,
        Cpf = p.Cpf,
        NomeMae = p.NomeMae,
        TipoDocumentoAlternativo = p.TipoDocumentoAlternativo,
        IdentificacaoAlternativa = p.IdentificacaoAlternativa,
        DataNascimento = p.DataNascimento,
        Telefone = p.Telefone,
        Escolaridade = p.Escolaridade,
        Profissao = p.Profissao,
        PossuiDeficiencia = p.PossuiDeficiencia,
        Observacoes = p.Observacoes,
        FamiliaId = p.FamiliaId,
        CriadoEm = p.CriadoEm,
        AtualizadoEm = p.AtualizadoEm,
    };

    public static Pessoa ToEntity(this PessoaCreateDto dto) => new()
    {
        Nome = dto.Nome,
        Cpf = string.IsNullOrWhiteSpace(dto.Cpf) ? null : dto.Cpf,
        NomeMae = dto.NomeMae,
        TipoDocumentoAlternativo = dto.TipoDocumentoAlternativo,
        IdentificacaoAlternativa = dto.IdentificacaoAlternativa,
        DataNascimento = dto.DataNascimento,
        Telefone = dto.Telefone,
        Escolaridade = dto.Escolaridade,
        Profissao = dto.Profissao,
        PossuiDeficiencia = dto.PossuiDeficiencia,
        Observacoes = dto.Observacoes,
    };
}
