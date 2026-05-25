using Caritas.Models.Common;

namespace Caritas.Models.Entities;

public class Pessoa : AuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? IdentificacaoAlternativa { get; set; }
    public DateOnly DataNascimento { get; set; }
    public string? Telefone { get; set; }
    public string? Escolaridade { get; set; }
    public string? Profissao { get; set; }
    public bool PossuiDeficiencia { get; set; }
    public string? Observacoes { get; set; }

    public int? FamiliaId { get; set; }
    public Familia? Familia { get; set; }
}
