using Caritas.Models.Common;
using Caritas.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

public class Atendimento : AuditableEntity
{
    public int FamiliaId { get; set; }

    [ForeignKey(nameof(FamiliaId))]
    public Familia Familia { get; set; } = null!;

    public int ParoquiaId { get; set; }

    [ForeignKey(nameof(ParoquiaId))]
    public Paroquia Paroquia { get; set; } = null!;

    public int VoluntarioId { get; set; }

    [ForeignKey(nameof(VoluntarioId))]
    public Usuario Voluntario { get; set; } = null!;

    public DateOnly DataAtendimento { get; set; }

    [Required, MaxLength(2000)]
    public string Relato { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal? RendaFamiliarMomento { get; set; }

    public int? QtdMembrosTrabalhando { get; set; }

    [MaxLength(1000)]
    public string? NecessidadesIdentificadas { get; set; }

    [MaxLength(1000)]
    public string? EncaminhamentosRealizados { get; set; }

    public SituacaoGeralFamilia? SituacaoGeral { get; set; }
}
