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
            .FirstOrDefaultAsync(f => f.Id == id);

    public async Task<PagedResponseDto<Familia>> GetPagedByParoquiaAsync(int page, int pageSize, int? paroquiaId)
        => await Context.Familias
            .Include(f => f.Paroquia)
            .Include(f => f.Responsavel)
            .Where(f => paroquiaId == null || f.ParoquiaId == paroquiaId)
            .OrderBy(f => f.CriadoEm)
            .ToPagedAsync(page, pageSize);
}
