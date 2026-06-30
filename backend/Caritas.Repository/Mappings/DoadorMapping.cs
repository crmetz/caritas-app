using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class DoadorMapping : IEntityTypeConfiguration<Doador>
{
    public void Configure(EntityTypeBuilder<Doador> b)
    {
        b.ToTable("Doador");
        b.HasKey(d => d.Id);
        b.Property(d => d.Nome).HasMaxLength(150).IsRequired();
        b.Property(d => d.Documento).HasMaxLength(20);
        b.Property(d => d.Telefone).HasMaxLength(20);
    }
}
