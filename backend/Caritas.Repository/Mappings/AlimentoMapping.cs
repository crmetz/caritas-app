using Caritas.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Caritas.Repository.Mappings;

public class AlimentoMapping : IEntityTypeConfiguration<Alimento>
{
    public void Configure(EntityTypeBuilder<Alimento> b)
    {
        b.ToTable("Alimento");
        b.Property(a => a.FormaMedida).HasConversion<string>().HasMaxLength(20).IsRequired();
        // Unicidade do nome do gênero (Descricao) é garantida na camada de service:
        // sob TPT, Descricao mora na tabela Item (compartilhada com Roupa), não em Alimento.
    }
}
