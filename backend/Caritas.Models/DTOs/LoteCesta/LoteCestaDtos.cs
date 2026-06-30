using System.ComponentModel.DataAnnotations;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.LoteCesta;

// Baixa (saída) de N cestas de um lote do controle: apenas repasse/descarte/outro.
// Entregas à família são registradas em Entrega (Motivo=Entregue não é aceito aqui).
public class CestaBaixaCreateDto
{
    [Required] public MotivoBaixaCesta Motivo { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
    [MaxLength(500)] public string? Observacao { get; set; }
}

// Opção de lote com saldo disponível, para seleção (ex.: registrar entrega de cestas).
public class LoteCestaSelectDto
{
    public int IdLote { get; set; }
    public string Label { get; set; } = string.Empty;
    public int Disponivel { get; set; }
}

// Linha do controle de cestas.
public class LoteCestaResponseDto
{
    public int Id { get; set; }
    public OrigemCesta Origem { get; set; }
    public int? IdConfiguracaoCesta { get; set; }
    public string? NomeConfiguracao { get; set; }
    public int? IdDoador { get; set; }
    public string? NomeDoador { get; set; }
    public int Quantidade { get; set; }
    public int QuantidadeDisponivel { get; set; }
    public string? Observacao { get; set; }
    public DateOnly? ValidadeMaisProxima { get; set; }   // menor validade entre os itens consumidos (montagem)
    public DateTime CriadoEm { get; set; }
}
