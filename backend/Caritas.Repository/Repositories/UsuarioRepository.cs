using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class UsuarioRepository : BaseRepository<Usuario>, IUsuarioRepository
{

    public UsuarioRepository(CaritasDbContext context) : base(context)
    {
        
    }

    public async Task<Usuario?> GetByEmailAsync(string email)
        => await DbSet.FirstOrDefaultAsync(u => u.Email == email);

    public override async Task<Usuario?> GetByIdAsync(int id)
        => await DbSet
            .Include(u => u.Perfil)
            .FirstOrDefaultAsync(u => u.Id == id && u.Ativo);
}
