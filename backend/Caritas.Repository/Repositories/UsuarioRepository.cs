using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class UsuarioRepository(CaritasDbContext context)
{
    private readonly CaritasDbContext _context = context;

    public async Task<Usuario> AddAsync(Usuario usuario)
    {
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
        => await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email);

    public async Task<Usuario?> GetByIdAsync(int id)
        => await _context.Usuarios
            .Include(u => u.Paroquia)
            .Include(u => u.Perfil)
            .FirstOrDefaultAsync(u => u.Id == id && u.Ativo);

    public async Task<Usuario> UpdateAsync(Usuario usuario)
    {
        _context.Usuarios.Update(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    public async Task DeleteAsync(Usuario usuario)
    {
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();
    }
}
