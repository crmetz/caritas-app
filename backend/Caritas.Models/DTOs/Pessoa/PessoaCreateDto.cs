using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Pessoa;

public class PessoaCreateDto
{
    public string Nome { get; set; } = string.Empty;
    public string? Cpf { get; set; }
    public string? NomeMae { get; set; }
    public TipoDocumentoAlternativo? TipoDocumentoAlternativo { get; set; }
    public string? IdentificacaoAlternativa { get; set; }
    public DateOnly DataNascimento { get; set; }
    public string? Telefone { get; set; }
    public string? Escolaridade { get; set; }
    public string? Profissao { get; set; }
    public bool PossuiDeficiencia { get; set; }
    public string? Observacoes { get; set; }
}
