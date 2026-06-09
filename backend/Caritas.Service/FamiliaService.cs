using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Pessoa;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class FamiliaService(CaritasDbContext context)
{
    private readonly FamiliaRepository _familiaRepository = new(context);

    public async Task<PagedResponseDto<FamiliaResponseDto>> GetPagedAsync(int page, int pageSize, int? paroquiaId = null)
    {
        var paged = await _familiaRepository.GetPagedByParoquiaAsync(page, pageSize, paroquiaId);
        return new PagedResponseDto<FamiliaResponseDto>
        {
            Items = paged.Items.Select(f => f.ToResponseDto()),
            TotalCount = paged.TotalCount,
        };
    }

    public async Task<FamiliaResponseDto> GetByIdAsync(int id)
    {
        var familia = await _familiaRepository.GetWithMembrosAsync(id)
            ?? throw new KeyNotFoundException($"Família com id {id} não encontrada.");
        return familia.ToResponseDto();
    }

    public async Task<FamiliaResponseDto> CreateAsync(FamiliaCreateDto dto)
    {
        ValidarIdentificacao(dto.Responsavel);

        await using var transaction = await context.Database.BeginTransactionAsync();

        var responsavel = dto.Responsavel.ToEntity();
        await context.Pessoas.AddAsync(responsavel);
        await context.SaveChangesAsync();

        var familia = new Familia
        {
            ParoquiaId = dto.ParoquiaId,
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

        foreach (var membroDto in dto.Membros)
        {
            ValidarIdentificacao(membroDto);
            var membro = membroDto.ToEntity();
            membro.FamiliaId = familia.Id;
            await context.Pessoas.AddAsync(membro);
        }

        await context.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetByIdAsync(familia.Id);
    }

    public async Task<FamiliaResponseDto> UpdateAsync(int id, FamiliaUpdateDto dto)
    {
        var familia = await _familiaRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Família com id {id} não encontrada.");

        familia.ParoquiaId = dto.ParoquiaId;
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

    public async Task<PessoaResponseDto> AdicionarMembroAsync(int familiaId, PessoaCreateDto dto)
    {
        var familia = await _familiaRepository.GetByIdAsync(familiaId)
            ?? throw new KeyNotFoundException($"Família com id {familiaId} não encontrada.");

        ValidarIdentificacao(dto);

        var pessoa = dto.ToEntity();
        pessoa.FamiliaId = familia.Id;
        await context.Pessoas.AddAsync(pessoa);
        await context.SaveChangesAsync();

        return pessoa.ToResponseDto();
    }

    public async Task<PessoaResponseDto> AtualizarMembroAsync(int familiaId, int pessoaId, PessoaCreateDto dto)
    {
        var familia = await _familiaRepository.GetWithMembrosAsync(familiaId)
            ?? throw new KeyNotFoundException($"Família com id {familiaId} não encontrada.");

        var pessoa = familia.ResponsavelId == pessoaId
            ? familia.Responsavel
            : familia.Membros.FirstOrDefault(p => p.Id == pessoaId);

        if (pessoa is null || pessoa.FamiliaId != familiaId)
            throw new KeyNotFoundException($"Pessoa com id {pessoaId} não encontrada nesta família.");

        ValidarIdentificacao(dto);

        pessoa.UpdateFromDto(dto);
        await context.SaveChangesAsync();

        return pessoa.ToResponseDto();
    }

    public async Task RemoverMembroAsync(int familiaId, int pessoaId)
    {
        var familia = await _familiaRepository.GetWithMembrosAsync(familiaId)
            ?? throw new KeyNotFoundException($"Família com id {familiaId} não encontrada.");

        if (familia.ResponsavelId == pessoaId)
            throw new InvalidOperationException("O responsável não pode ser removido sem antes trocar o responsável da família.");

        var membro = familia.Membros.FirstOrDefault(p => p.Id == pessoaId)
            ?? throw new KeyNotFoundException($"Membro com id {pessoaId} não encontrado nesta família.");

        membro.FamiliaId = null;
        await context.SaveChangesAsync();
    }

    public async Task<FamiliaResponseDto> TrocarResponsavelAsync(int familiaId, int pessoaId)
    {
        var familia = await _familiaRepository.GetWithMembrosAsync(familiaId)
            ?? throw new KeyNotFoundException($"Família com id {familiaId} não encontrada.");

        var novoResponsavel = familia.Membros.FirstOrDefault(p => p.Id == pessoaId)
            ?? await context.Pessoas.FirstOrDefaultAsync(p => p.Id == pessoaId && p.FamiliaId == familiaId)
            ?? throw new KeyNotFoundException($"Pessoa com id {pessoaId} não encontrada nesta família.");

        familia.ResponsavelId = novoResponsavel.Id;
        await context.SaveChangesAsync();

        return await GetByIdAsync(familiaId);
    }

    private static void ValidarIdentificacao(PessoaCreateDto dto)
    {
        var temCpf = !string.IsNullOrWhiteSpace(dto.Cpf);
        var temNomeMae = !string.IsNullOrWhiteSpace(dto.NomeMae) && dto.DataNascimento != default;
        var temDocAlternativo = dto.TipoDocumentoAlternativo.HasValue && !string.IsNullOrWhiteSpace(dto.IdentificacaoAlternativa);

        if (!temCpf && !temNomeMae && !temDocAlternativo)
            throw new ArgumentException(
                "É necessário informar ao menos uma forma de identificação: CPF, nome da mãe + data de nascimento, ou tipo e número de documento alternativo.");
    }
}
