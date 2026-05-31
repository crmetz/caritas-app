using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class UsuarioRepository(CaritasDbContext context) : IUsuarioRepository
{
    private readonly DbSet<Usuario> _dbSet = context.Set<Usuario>();

    public async Task<Usuario?> GetByIdAsync(int id)
        => await _dbSet
            .Include(u => u.Perfil)
            .FirstOrDefaultAsync(u => u.Id == id && u.Ativo);

    public async Task<Usuario?> GetByEmailAsync(string email)
        => await _dbSet.FirstOrDefaultAsync(u => u.Email == email);

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