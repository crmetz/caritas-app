using System.Reflection;
using Caritas.Models.Common;
using Caritas.Models.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options) : IdentityDbContext<Usuario, Perfil, int>(options)
{
    public DbSet<Familia> Familias => Set<Familia>();
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Paroquia> Paroquias { get; set; }
    public DbSet<Endereco> Enderecos { get; set; }
    public DbSet<UsuarioParoquia> UsuarioParoquias { get; set; }
    public DbSet<Perfil> Perfis { get; set; }
    public DbSet<Permissao> Permissoes { get; set; }
    public DbSet<PerfilPermissao> PerfilPermissoes { get; set; }

    public DbSet<Remessa> Remessas { get; set; }
    public DbSet<Peca> Pecas { get; set; }
    public DbSet<VendaBazar> VendasBazar { get; set; }
    public DbSet<ItemVendaBazar> ItensVendaBazar { get; set; }
    public DbSet<VendaBrecho> VendasBrecho { get; set; }
    public DbSet<ItemVendaBrecho> ItensVendaBrecho { get; set; }
    public DbSet<LancamentoCaixa> LancamentosCaixa { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

        modelBuilder.Entity<Perfil>()
            .HasIndex(p => p.Name)
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

        modelBuilder.Entity<LancamentoCaixa>()
            .HasOne(l => l.VendaBrecho)
            .WithOne(v => v.LancamentoCaixa)
            .HasForeignKey<LancamentoCaixa>(l => l.VendaBrechoId)
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