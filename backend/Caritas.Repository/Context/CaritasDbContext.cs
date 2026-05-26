using System.Reflection;
using Caritas.Models.Common;
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options) : DbContext(options)
{
    public DbSet<Familia> Familias => Set<Familia>();
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Paroquia> Paroquias { get; set; }
    public DbSet<Endereco> Enderecos { get; set; }
    public DbSet<UsuarioParoquia> UsuarioParoquias { get; set; }
    public DbSet<Perfil> Perfis { get; set; }
    public DbSet<Permissao> Permissoes { get; set; }
    public DbSet<PerfilPermissao> PerfilPermissoes { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.Entity<Perfil>()
            .HasIndex(p => p.Nome)
            .IsUnique();

        modelBuilder.Entity<Perfil>()
            .HasOne(p => p.PerfilPai)
            .WithMany(p => p.SubPerfis)
            .HasForeignKey(p => p.PerfilPaiId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Permissao>()
            .HasIndex(p => p.Codigo)
            .IsUnique();

        modelBuilder.Entity<Usuario>()
            .HasOne(u => u.UsuarioCriador)
            .WithMany(u => u.UsuariosCriados)
            .HasForeignKey(u => u.UsuarioCriadorId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added)
                entry.Entity.CriadoEm = DateTime.UtcNow;

            if (entry.State == EntityState.Modified)
                entry.Entity.AtualizadoEm = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
