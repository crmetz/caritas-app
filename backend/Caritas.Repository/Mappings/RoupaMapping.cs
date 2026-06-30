using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class RoupaMapping : IEntityTypeConfiguration<Roupa>
{
    public void Configure(EntityTypeBuilder<Roupa> b)
    {
        b.ToTable("Roupa");
        b.Property(r => r.Categoria).HasConversion<string>().HasMaxLength(30).IsRequired();
        b.Property(r => r.FaixaEtaria).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Genero).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Estacao).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Condicao).HasConversion<string>().HasMaxLength(20);
        b.Property(r => r.Tamanho).HasMaxLength(10);
        b.Property(r => r.Codigo).HasMaxLength(50);
    }
}
