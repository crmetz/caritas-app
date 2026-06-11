using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class FamiliaRepository(CaritasDbContext context)
    : BaseRepository<Familia>(context), IFamiliaRepository
{
    public async Task<Familia?> GetWithMembrosAsync(int id)
        => await Context.Familias
            .Include(f => f.Paroquia)
            .Include(f => f.Responsavel)
            .Include(f => f.Membros)
            .Include(f => f.Cidade)
            .AsSplitQuery()
            .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<PagedResponseDto<Familia>> GetPagedAsync(int page, int pageSize, FamiliaFilterDto filter)
        => await Context.Familias
            .Include(f => f.Paroquia)
            .Include(f => f.Responsavel)
            .Include(f => f.Membros)
            .Include(f => f.Cidade)
            .AsSplitQuery()
            .Where(f => filter.ParoquiaId == null || f.ParoquiaId == filter.ParoquiaId)
            .Where(f => filter.SituacaoMoradia == null || f.SituacaoMoradia == filter.SituacaoMoradia)
            .Where(f => filter.CidadeId == null || f.CidadeId == filter.CidadeId)
            .Where(f => string.IsNullOrWhiteSpace(filter.ResponsavelNome)
                || EF.Functions.ILike(f.Responsavel.Nome, $"%{filter.ResponsavelNome}%"))
            .Where(f => string.IsNullOrWhiteSpace(filter.Bairro)
                || EF.Functions.ILike(f.Bairro, $"%{filter.Bairro}%"))
            .OrderBy(f => f.CriadoEm)
            .ToPagedAsync(page, pageSize);
}
