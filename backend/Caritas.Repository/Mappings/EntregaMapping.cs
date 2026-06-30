using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class EntregaMapping : IEntityTypeConfiguration<Entrega>
{
    public void Configure(EntityTypeBuilder<Entrega> b)
    {
        b.ToTable("Entrega");
        b.HasKey(e => e.Id);
        b.Property(e => e.Observacao).HasMaxLength(500);
        b.HasOne(e => e.Familia).WithMany().HasForeignKey(e => e.IdFamilia).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(e => e.Paroquia).WithMany().HasForeignKey(e => e.IdParoquia).OnDelete(DeleteBehavior.Restrict);
    }
}
