using Caritas.Models.Common;
using Caritas.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

public class Familia : AuditableEntity
{
    public int ParoquiaId { get; set; }

    [ForeignKey(nameof(ParoquiaId))]
    public Paroquia Paroquia { get; set; } = null!;

    public int ResponsavelId { get; set; }

    [ForeignKey(nameof(ResponsavelId))]
    public Pessoa Responsavel { get; set; } = null!;

    public ICollection<Pessoa> Membros { get; set; } = [];

    [Column(TypeName = "decimal(10,2)")]
    public decimal RendaFamiliar { get; set; }

    public SituacaoMoradia SituacaoMoradia { get; set; }

    public Vulnerabilidade Vulnerabilidade { get; set; }

    [MaxLength(1000)]
    public string? Observacoes { get; set; }

    [Required, MaxLength(200)]
    public string Rua { get; set; } = string.Empty;

    [Required, MaxLength(20)]
    public string Numero { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Complemento { get; set; }

    [Required, MaxLength(100)]
    public string Bairro { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Cidade { get; set; } = string.Empty;

    [Required, MaxLength(2)]
    public string Estado { get; set; } = string.Empty;

    [Required, MaxLength(9)]
    public string Cep { get; set; } = string.Empty;
}
