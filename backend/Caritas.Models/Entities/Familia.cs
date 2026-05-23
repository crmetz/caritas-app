using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

public class Familia : BaseEntity
{
    public int ResponsavelId { get; set; }
    public Pessoa Responsavel { get; set; } = null!;
    public ICollection<Pessoa> Membros { get; set; } = [];

    public decimal RendaFamiliar { get; set; }
    public SituacaoMoradia SituacaoMoradia { get; set; }
    public Vulnerabilidade Vulnerabilidade { get; set; }
    public string? Observacoes { get; set; }

    public string Rua { get; set; } = string.Empty;
    public string Numero { get; set; } = string.Empty;
    public string? Complemento { get; set; }
    public string Bairro { get; set; } = string.Empty;
    public string Cidade { get; set; } = string.Empty;
    public string Estado { get; set; } = string.Empty;
    public string Cep { get; set; } = string.Empty;
}
