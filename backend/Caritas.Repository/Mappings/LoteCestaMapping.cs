using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class LoteCestaMapping : IEntityTypeConfiguration<LoteCesta>
{
    public void Configure(EntityTypeBuilder<LoteCesta> b)
    {
        b.ToTable("LoteCesta");
        b.HasKey(l => l.Id);
        b.Property(l => l.Origem).HasConversion<string>().HasMaxLength(20).IsRequired();
        b.Property(l => l.Observacao).HasMaxLength(500);

        b.HasOne(l => l.Paroquia).WithMany().HasForeignKey(l => l.IdParoquia).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(l => l.ConfiguracaoCesta).WithMany().HasForeignKey(l => l.IdConfiguracaoCesta).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(l => l.Doacao).WithMany().HasForeignKey(l => l.IdDoacao).OnDelete(DeleteBehavior.Restrict);
    }
}
