using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class PessoaMapping : IEntityTypeConfiguration<Pessoa>
{
    public void Configure(EntityTypeBuilder<Pessoa> builder)
    {
        builder.HasKey(p => p.Id);

        builder.Property(p => p.Nome).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Cpf).HasMaxLength(14);
        builder.Property(p => p.IdentificacaoAlternativa).HasMaxLength(100);
        builder.Property(p => p.Telefone).HasMaxLength(20);
        builder.Property(p => p.Escolaridade).HasMaxLength(100);
        builder.Property(p => p.Profissao).HasMaxLength(100);
        builder.Property(p => p.Observacoes).HasMaxLength(1000);

        builder.HasIndex(p => p.Cpf).IsUnique().HasFilter("\"Cpf\" IS NOT NULL");
    }
}
