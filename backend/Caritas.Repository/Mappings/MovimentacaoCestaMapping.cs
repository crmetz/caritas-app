using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class MovimentacaoCestaMapping : IEntityTypeConfiguration<MovimentacaoCesta>
{
    public void Configure(EntityTypeBuilder<MovimentacaoCesta> b)
    {
        b.ToTable("MovimentacaoCesta");
        b.HasKey(m => m.Id);
        b.Property(m => m.Motivo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(m => m.Observacao).HasMaxLength(500);

        b.HasIndex(m => m.IdLoteCesta);

        b.HasOne(m => m.LoteCesta).WithMany().HasForeignKey(m => m.IdLoteCesta).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Paroquia>().WithMany().HasForeignKey(m => m.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<Entrega>().WithMany().HasForeignKey(m => m.IdEntrega).OnDelete(DeleteBehavior.Restrict);
    }
}
