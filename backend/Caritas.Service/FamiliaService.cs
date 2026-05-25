using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Pessoa;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Caritas.Repository.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class FamiliaService(CaritasDbContext context)
{
    private readonly FamiliaRepository _familiaRepository = new(context);

    public async Task<PagedResponseDto<FamiliaResponseDto>> GetPagedAsync(int page, int pageSize)
    {
        var pagedEntities = await context.Familias
            .Include(f => f.Responsavel)
            .OrderBy(f => f.CriadoEm)
            .ToPagedAsync(page, pageSize);

        return new PagedResponseDto<FamiliaResponseDto>
        {
            Items = pagedEntities.Items.Select(MapToResponse),
            TotalCount = pagedEntities.TotalCount,
        };
    }

    public async Task<FamiliaResponseDto> GetByIdAsync(int id)
    {
        var familia = await _familiaRepository.GetWithMembrosAsync(id)
            ?? throw new KeyNotFoundException($"Família com id {id} não encontrada.");
        return MapToResponse(familia);
    }

    public async Task<FamiliaResponseDto> CreateAsync(FamiliaCreateDto dto)
    {
        await using var transaction = await context.Database.BeginTransactionAsync();

        var responsavel = MapPessoaFromDto(dto.Responsavel);
        await context.Pessoas.AddAsync(responsavel);
        await context.SaveChangesAsync();

        var familia = new Familia
        {
            ResponsavelId = responsavel.Id,
            RendaFamiliar = dto.RendaFamiliar,
            SituacaoMoradia = dto.SituacaoMoradia,
            Vulnerabilidade = dto.Vulnerabilidade,
            Observacoes = dto.Observacoes,
            Rua = dto.Rua,
            Numero = dto.Numero,
            Complemento = dto.Complemento,
            Bairro = dto.Bairro,
            Cidade = dto.Cidade,
            Estado = dto.Estado,
            Cep = dto.Cep,
        };

        await context.Familias.AddAsync(familia);
        await context.SaveChangesAsync();

        responsavel.FamiliaId = familia.Id;
        await context.SaveChangesAsync();

        await transaction.CommitAsync();

        return await GetByIdAsync(familia.Id);
    }

    public async Task<FamiliaResponseDto> UpdateAsync(int id, FamiliaUpdateDto dto)
    {
        var familia = await _familiaRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Família com id {id} não encontrada.");

        familia.ResponsavelId = dto.ResponsavelId;
        familia.RendaFamiliar = dto.RendaFamiliar;
        familia.SituacaoMoradia = dto.SituacaoMoradia;
        familia.Vulnerabilidade = dto.Vulnerabilidade;
        familia.Observacoes = dto.Observacoes;
        familia.Rua = dto.Rua;
        familia.Numero = dto.Numero;
        familia.Complemento = dto.Complemento;
        familia.Bairro = dto.Bairro;
        familia.Cidade = dto.Cidade;
        familia.Estado = dto.Estado;
        familia.Cep = dto.Cep;

        await _familiaRepository.UpdateAsync(familia);
        return await GetByIdAsync(familia.Id);
    }

    public async Task DeleteAsync(int id)
        => await _familiaRepository.DeleteAsync(id);

    private static FamiliaResponseDto MapToResponse(Familia f) => new()
    {
        Id = f.Id,
        ResponsavelId = f.ResponsavelId,
        Responsavel = f.Responsavel is not null ? MapPessoaToResponse(f.Responsavel) : null,
        Membros = f.Membros?.Select(MapPessoaToResponse) ?? [],
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

    private static PessoaResponseDto MapPessoaToResponse(Pessoa p) => new()
    {
        Id = p.Id,
        Nome = p.Nome,
        Cpf = p.Cpf,
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

    private static Pessoa MapPessoaFromDto(PessoaCreateDto dto) => new()
    {
        Nome = dto.Nome,
        Cpf = dto.Cpf,
        IdentificacaoAlternativa = dto.IdentificacaoAlternativa,
        DataNascimento = dto.DataNascimento,
        Telefone = dto.Telefone,
        Escolaridade = dto.Escolaridade,
        Profissao = dto.Profissao,
        PossuiDeficiencia = dto.PossuiDeficiencia,
        Observacoes = dto.Observacoes,
    };
}
