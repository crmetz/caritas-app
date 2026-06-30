using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class DoacaoMapping : IEntityTypeConfiguration<Doacao>
{
    public void Configure(EntityTypeBuilder<Doacao> b)
    {
        b.ToTable("Doacao");
        b.HasKey(d => d.Id);
        b.Property(d => d.Tipo).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(d => d.Observacao).HasMaxLength(500);
        b.HasOne(d => d.Doador).WithMany().HasForeignKey(d => d.IdDoador).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(d => d.Paroquia).WithMany().HasForeignKey(d => d.IdParoquia).OnDelete(DeleteBehavior.Restrict);
    }
}
