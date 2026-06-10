using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class UsuarioRepository(CaritasDbContext context) : IUsuarioRepository
{
    private readonly DbSet<Usuario> _dbSet = context.Set<Usuario>();

    public async Task<PagedResponseDto<Usuario>> GetPagedAsync(UsuarioPagedRequestDto request, IList<int>? paroquiaIds = null)
    {
        var query = _dbSet.AsQueryable();

        if (paroquiaIds != null)
            query = query.Where(u => u.UsuarioParoquias.Any(up => paroquiaIds.Contains(up.ParoquiaId)));

        if (!string.IsNullOrWhiteSpace(request.SearchTerm))
        {
            var termo = request.SearchTerm.ToLower();
            query = query.Where(u =>
                u.Nome!.ToLower().Contains(termo) ||
                u.Sobrenome!.ToLower().Contains(termo) ||
                u.Email!.ToLower().Contains(termo));
        }

        return await query
            .OrderBy(u => u.Nome)
            .ToPagedAsync(request.Page, request.PageSize);
    }

    public async Task<Usuario?> GetByIdAsync(int id)
        => await _dbSet
            .Include(u => u.UsuarioParoquias)
                .ThenInclude(up => up.Paroquia)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task<Usuario?> GetByEmailAsync(string email)
        => await _dbSet.FirstOrDefaultAsync(u => u.Email == email);

    public async Task<IList<int>> GetParoquiaIdsByUserIdAsync(int userId)
        => await context.UsuarioParoquias
            .Where(up => up.UsuarioId == userId)
            .Select(up => up.ParoquiaId)
            .ToListAsync();

    public async Task UpdateAsync(Usuario usuario)
    {
        _dbSet.Update(usuario);
        await context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var usuario = await GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");
        _dbSet.Remove(usuario);
        await context.SaveChangesAsync();
    }
}