using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class MovimentacaoEstoqueMapping : IEntityTypeConfiguration<MovimentacaoEstoque>
{
    public void Configure(EntityTypeBuilder<MovimentacaoEstoque> b)
    {
        b.ToTable("MovimentacaoEstoque");
        b.HasKey(m => m.Id);
        b.Property(m => m.TipoOperacao).HasConversion<string>().HasMaxLength(10).IsRequired();
        b.Property(m => m.OrigemTipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(m => m.Lote).HasMaxLength(50);
        b.Property(m => m.Observacao).HasMaxLength(500);

        b.HasIndex(m => new { m.OrigemTipo, m.OrigemId });
        b.HasIndex(m => new { m.IdItem, m.IdParoquia });

        b.HasOne(m => m.Item).WithMany().HasForeignKey(m => m.IdItem).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Paroquia>().WithMany().HasForeignKey(m => m.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        // OrigemId: sem FK (polimórfico).
    }
}
