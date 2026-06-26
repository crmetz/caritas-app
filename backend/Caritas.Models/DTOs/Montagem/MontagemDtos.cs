using System.ComponentModel.DataAnnotations;

namespace Caritas.Models.DTOs.Montagem;

// Etapa 1: pedir a proposta de alocação para montar N cestas de uma configuração.
public class MontagemSimularDto
{
    [Required] public int IdConfiguracaoCesta { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
}

// Proposta retornada pela simulação (não altera estado).
public class MontagemPropostaDto
{
    public int IdConfiguracaoCesta { get; set; }
    public int Quantidade { get; set; }
    public List<PropostaLinhaDto> Linhas { get; set; } = [];
}

public class PropostaLinhaDto
{
    public int IdAlimento { get; set; }
    public string NomeAlimento { get; set; } = string.Empty;
    public int Tamanho { get; set; }                   // unidade-base
    public string TamanhoFormatado { get; set; } = string.Empty;
    public int PacotesNecessarios { get; set; }
    public int PacotesFaltantes { get; set; }          // > 0 => estoque insuficiente
    // Todos os lotes disponíveis do item (não só os tocados), para permitir trocar validade e
    // combinar lotes na etapa de revisão. QtdSugerida traz a alocação FIFO (não-vencidos primeiro).
    public List<LoteDisponivelDto> LotesDisponiveis { get; set; } = [];
}

public class LoteDisponivelDto
{
    public DateOnly? Validade { get; set; }
    public string? Lote { get; set; }
    public int Saldo { get; set; }                     // pacotes em estoque nesse lote
    public bool Vencido { get; set; }                  // validade < hoje (alerta)
    public int QtdSugerida { get; set; }               // alocação proposta (FIFO)
}

// Etapa 2: confirmar a montagem com as alocações (possivelmente editadas).
public class MontagemConfirmarDto
{
    [Required] public int IdConfiguracaoCesta { get; set; }
    [Range(1, int.MaxValue)] public int Quantidade { get; set; }
    [Required, MinLength(1)] public List<AlocacaoConfirmadaDto> Alocacoes { get; set; } = [];
    [MaxLength(500)] public string? Observacao { get; set; }
}

public class AlocacaoConfirmadaDto
{
    [Required] public int IdAlimento { get; set; }
    [Required] public int Tamanho { get; set; }        // unidade-base
    public DateOnly? Validade { get; set; }
    [MaxLength(50)] public string? Lote { get; set; }
    [Range(1, int.MaxValue)] public int QtdPacotes { get; set; }
}
