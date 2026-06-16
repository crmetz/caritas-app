using Caritas.Models.Common;
using Caritas.Models.Enums;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Caritas.Models.Entities;

public class Pessoa : AuditableEntity
{
    [Required, MaxLength(200)]
    public string Nome { get; set; } = string.Empty;

    [MaxLength(14)]
    public string? Cpf { get; set; }

    [MaxLength(200)]
    public string? NomeMae { get; set; }

    public TipoDocumentoAlternativo? TipoDocumentoAlternativo { get; set; }

    [MaxLength(100)]
    public string? IdentificacaoAlternativa { get; set; }

    public DateOnly DataNascimento { get; set; }

    [MaxLength(20)]
    public string? Telefone { get; set; }

    [MaxLength(100)]
    public string? Escolaridade { get; set; }

    [MaxLength(100)]
    public string? Profissao { get; set; }

    public bool PossuiDeficiencia { get; set; }

    [MaxLength(1000)]
    public string? Observacoes { get; set; }

    public int? FamiliaId { get; set; }

    [ForeignKey(nameof(FamiliaId))]
    public Familia? Familia { get; set; }
}
