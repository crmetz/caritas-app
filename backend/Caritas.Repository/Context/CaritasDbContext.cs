using System.Reflection;
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options) : DbContext(options)
{
    public DbSet<Familia> Familias => Set<Familia>();
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Paroquia> Paroquias { get; set; }
    public DbSet<Endereco> Enderecos { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Perfil> Perfis { get; set; }
    public DbSet<Permissao> Permissoes { get; set; }
    public DbSet<PerfilPermissao> PerfilPermissoes { get; set; }
    public DbSet<Notificacao> Notificacoes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.Entity<Perfil>()
            .HasIndex(p => p.Nome)
            .IsUnique();
 
        modelBuilder.Entity<Permissao>()
            .HasIndex(p => p.Codigo)
            .IsUnique();
 
        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.Criador)
            .WithMany(u => u.UsuariosCriados)
            .HasForeignKey(u => u.IdCriador)
            .OnDelete(DeleteBehavior.Restrict); // evita cascade delete em auto-referência
 
        modelBuilder.Entity<Notificacao>()
            .Property(n => n.TipoDestinatario)
            .HasConversion<string>();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
