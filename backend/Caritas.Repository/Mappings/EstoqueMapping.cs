using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class EstoqueMapping : IEntityTypeConfiguration<Estoque>
{
    public void Configure(EntityTypeBuilder<Estoque> b)
    {
        b.ToTable("Estoque");
        b.HasKey(e => e.Id);
        b.Property(e => e.Lote).HasMaxLength(50);
        b.Property(e => e.Quantidade).HasDefaultValue(0);

        b.HasIndex(e => new { e.IdItem, e.IdParoquia, e.Tamanho, e.Validade, e.Lote })
            .IsUnique()
            .AreNullsDistinct(false);   // Npgsql 9+ / PG16: NULLS NOT DISTINCT

        b.HasOne(e => e.Item).WithMany().HasForeignKey(e => e.IdItem).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Paroquia).WithMany().HasForeignKey(e => e.IdParoquia).OnDelete(DeleteBehavior.Restrict);
    }
}
