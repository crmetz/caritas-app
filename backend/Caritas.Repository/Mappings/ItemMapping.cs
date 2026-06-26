using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class ItemMapping : IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> b)
    {
        b.UseTptMappingStrategy();
        b.ToTable("Item");
        b.HasKey(i => i.Id);
        b.Property(i => i.Tipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(i => i.Descricao).HasMaxLength(200).IsRequired();
    }
}
