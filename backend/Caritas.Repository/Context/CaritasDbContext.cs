using System.Reflection;
using Caritas.Models.Common;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options, ICurrentSession currentSession)
    : IdentityDbContext<Usuario, Perfil, int>(options)
{
    public DbSet<Familia> Familias => Set<Familia>();
    public DbSet<FamiliaCidade> FamiliaCidades => Set<FamiliaCidade>();
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();
    public DbSet<Atendimento> Atendimentos => Set<Atendimento>();
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
    public DbSet<SessaoCaixaBrecho> SessoesCaixaBrecho { get; set; }

    public DbSet<Item> Items => Set<Item>();
    public DbSet<Alimento> Alimentos => Set<Alimento>();
    public DbSet<Roupa> Roupas => Set<Roupa>();
    public DbSet<Estoque> Estoques => Set<Estoque>();
    public DbSet<MovimentacaoEstoque> Movimentacoes => Set<MovimentacaoEstoque>();
    public DbSet<Doador> Doadores => Set<Doador>();
    public DbSet<Doacao> Doacoes => Set<Doacao>();
    public DbSet<ConfiguracaoCesta> ConfiguracoesCesta => Set<ConfiguracaoCesta>();
    public DbSet<ItemConfiguracaoCesta> ItensConfiguracaoCesta => Set<ItemConfiguracaoCesta>();
    public DbSet<LoteCesta> LotesCesta => Set<LoteCesta>();
    public DbSet<MovimentacaoCesta> MovimentacoesCesta => Set<MovimentacaoCesta>();
    public DbSet<Entrega> Entregas => Set<Entrega>();

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

        modelBuilder.Entity<Paroquia>()
            .Property(p => p.Ativa)
            .HasDefaultValue(true);

        modelBuilder.Entity<Pessoa>()
            .HasIndex(p => p.Cpf)
            .IsUnique()
            .HasFilter("\"Cpf\" IS NOT NULL");

        modelBuilder.Entity<Familia>()
            .HasOne(f => f.Responsavel)
            .WithMany()
            .HasForeignKey(f => f.ResponsavelId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Familia>()
            .HasMany(f => f.Membros)
            .WithOne(p => p.Familia)
            .HasForeignKey(p => p.FamiliaId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Familia>()
            .HasOne(f => f.Paroquia)
            .WithMany()
            .HasForeignKey(f => f.ParoquiaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Familia>()
            .HasOne(f => f.Cidade)
            .WithMany(c => c.Familias)
            .HasForeignKey(f => f.CidadeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<FamiliaCidade>()
            .HasIndex(c => c.Nome)
            .IsUnique();

        modelBuilder.Entity<Atendimento>()
            .HasOne(a => a.Familia)
            .WithMany()
            .HasForeignKey(a => a.FamiliaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Atendimento>()
            .HasOne(a => a.Paroquia)
            .WithMany()
            .HasForeignKey(a => a.ParoquiaId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Atendimento>()
            .HasOne(a => a.Voluntario)
            .WithMany()
            .HasForeignKey(a => a.VoluntarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var agora = DateTime.UtcNow;
        var usuarioId = currentSession.UsuarioId;

        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CriadoEm = agora;
            if (entry.State == EntityState.Modified) entry.Entity.AtualizadoEm = agora;
        }

        foreach (var entry in ChangeTracker.Entries<FullAuditableEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CriadoPor = usuarioId;
            if (entry.State == EntityState.Modified) entry.Entity.AtualizadoPor = usuarioId;
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
