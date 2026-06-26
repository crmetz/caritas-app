using Caritas.Models.Common;

namespace Caritas.Models.Entities;

public class Doador : FullAuditableEntity
{
    public string Nome { get; set; } = string.Empty;
    public string? Documento { get; set; }   // CPF/CNPJ
    public string? Telefone { get; set; }
}
