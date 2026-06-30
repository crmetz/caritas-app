using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class ConfiguracaoCestaMapping : IEntityTypeConfiguration<ConfiguracaoCesta>
{
    public void Configure(EntityTypeBuilder<ConfiguracaoCesta> b)
    {
        b.ToTable("ConfiguracaoCesta");
        b.HasKey(c => c.Id);
        b.Property(c => c.Nome).HasMaxLength(100).IsRequired();
        b.HasOne(c => c.Paroquia).WithMany().HasForeignKey(c => c.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(c => c.Itens).WithOne(i => i.ConfiguracaoCesta)
            .HasForeignKey(i => i.IdConfiguracaoCesta).OnDelete(DeleteBehavior.Cascade);
    }
}
