namespace Caritas.Models.DTOs.Pessoa;

public class PessoaResponseDto
{
    public int Id { get; set; }
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
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
