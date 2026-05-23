using System.Reflection;
using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Context;

public class CaritasDbContext(DbContextOptions<CaritasDbContext> options) : DbContext(options)
{
    public DbSet<Familia> Familias => Set<Familia>();
    public DbSet<Pessoa> Pessoas => Set<Pessoa>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
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
