using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class FamiliaMapping : IEntityTypeConfiguration<Familia>
{
    public void Configure(EntityTypeBuilder<Familia> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.RendaFamiliar).HasPrecision(10, 2);
        builder.Property(f => f.Rua).HasMaxLength(200).IsRequired();
        builder.Property(f => f.Numero).HasMaxLength(20).IsRequired();
        builder.Property(f => f.Complemento).HasMaxLength(100);
        builder.Property(f => f.Bairro).HasMaxLength(100).IsRequired();
        builder.Property(f => f.Cidade).HasMaxLength(100).IsRequired();
        builder.Property(f => f.Estado).HasMaxLength(2).IsRequired();
        builder.Property(f => f.Cep).HasMaxLength(9).IsRequired();
        builder.Property(f => f.Observacoes).HasMaxLength(1000);

        builder
            .HasOne(f => f.Responsavel)
            .WithMany()
            .HasForeignKey(f => f.ResponsavelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .HasMany(f => f.Membros)
            .WithOne(p => p.Familia)
            .HasForeignKey(p => p.FamiliaId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
