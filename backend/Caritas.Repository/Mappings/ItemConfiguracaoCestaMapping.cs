using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class ItemConfiguracaoCestaMapping : IEntityTypeConfiguration<ItemConfiguracaoCesta>
{
    public void Configure(EntityTypeBuilder<ItemConfiguracaoCesta> b)
    {
        b.ToTable("ItemConfiguracaoCesta");
        b.HasKey(i => i.Id);
        // FK p/ ConfiguracaoCesta é configurada em ConfiguracaoCestaMapping (HasMany/WithOne).
        b.HasOne(i => i.Alimento).WithMany().HasForeignKey(i => i.IdAlimento).OnDelete(DeleteBehavior.Restrict);
    }
}
