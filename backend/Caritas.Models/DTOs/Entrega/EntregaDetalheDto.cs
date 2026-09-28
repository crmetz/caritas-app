using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Entrega;

// Detalhe de uma entrega: o que saiu de cesta (MovimentacaoCesta) e de estoque (MovimentacaoEstoque).
public class EntregaDetalheDto
{
    public int Id { get; set; }
    public int IdFamilia { get; set; }
    public string? NomeFamilia { get; set; }
    public string? Observacao { get; set; }
    public DateTime CriadoEm { get; set; }
    public List<EntregaCestaDetalheDto> Cestas { get; set; } = [];
    public List<MovimentacaoHistoricoDto> Itens { get; set; } = [];   // reusa o DTO do histórico de estoque
}

// Linha de cesta de uma entrega, já com o lote de origem resolvido para exibição.
public class EntregaCestaDetalheDto
{
    public int IdLoteCesta { get; set; }
    public int Quantidade { get; set; }
    public OrigemCesta Origem { get; set; }
    public string? NomeConfiguracao { get; set; }   // só quando Origem = Montagem
}
