using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Caixa;

public class FamiliaResumoDto
{
    public int Id { get; set; }
    public string NomeResponsavel { get; set; } = string.Empty;
}

public class LancamentoCaixaResponseDto
{
    public int Id { get; set; }
    public int ParoquiaId { get; set; }
    public DateTime Data { get; set; }
    public TipoLancamento Tipo { get; set; }
    public decimal Valor { get; set; }
    public OrigemEntrada? Origem { get; set; }
    public DestinoSaida? Destino { get; set; }
    public int? FamiliaId { get; set; }
    public FamiliaResumoDto? Familia { get; set; }
    public string Responsavel { get; set; } = string.Empty;
    public bool GeradoAutomaticamente { get; set; }
    public string? Observacoes { get; set; }
    public bool Cancelado { get; set; }
    public DateTime? CanceladoEm { get; set; }
    public string? MotivoCancelamento { get; set; }
    public DateTime CriadoEm { get; set; }
    public DateTime AtualizadoEm { get; set; }
}
