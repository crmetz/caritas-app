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
        NomeMae = string.IsNullOrWhiteSpace(dto.NomeMae) ? null : dto.NomeMae,
        TipoDocumentoAlternativo = dto.TipoDocumentoAlternativo,
        IdentificacaoAlternativa = string.IsNullOrWhiteSpace(dto.IdentificacaoAlternativa) ? null : dto.IdentificacaoAlternativa,
        DataNascimento = dto.DataNascimento,
        Telefone = string.IsNullOrWhiteSpace(dto.Telefone) ? null : dto.Telefone,
        Escolaridade = string.IsNullOrWhiteSpace(dto.Escolaridade) ? null : dto.Escolaridade,
        Profissao = string.IsNullOrWhiteSpace(dto.Profissao) ? null : dto.Profissao,
        PossuiDeficiencia = dto.PossuiDeficiencia,
        Observacoes = string.IsNullOrWhiteSpace(dto.Observacoes) ? null : dto.Observacoes,
    };

    public static void UpdateFromDto(this Pessoa pessoa, PessoaCreateDto dto)
    {
        pessoa.Nome = dto.Nome;
        pessoa.Cpf = string.IsNullOrWhiteSpace(dto.Cpf) ? null : dto.Cpf;
        pessoa.NomeMae = string.IsNullOrWhiteSpace(dto.NomeMae) ? null : dto.NomeMae;
        pessoa.TipoDocumentoAlternativo = dto.TipoDocumentoAlternativo;
        pessoa.IdentificacaoAlternativa = string.IsNullOrWhiteSpace(dto.IdentificacaoAlternativa) ? null : dto.IdentificacaoAlternativa;
        pessoa.DataNascimento = dto.DataNascimento;
        pessoa.Telefone = string.IsNullOrWhiteSpace(dto.Telefone) ? null : dto.Telefone;
        pessoa.Escolaridade = string.IsNullOrWhiteSpace(dto.Escolaridade) ? null : dto.Escolaridade;
        pessoa.Profissao = string.IsNullOrWhiteSpace(dto.Profissao) ? null : dto.Profissao;
        pessoa.PossuiDeficiencia = dto.PossuiDeficiencia;
        pessoa.Observacoes = string.IsNullOrWhiteSpace(dto.Observacoes) ? null : dto.Observacoes;
    }
}
