using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

// Controle de cestas. Um lote de N cestas iguais:
//  - Origem=Montagem: montado de uma ConfiguracaoCesta, consumindo o estoque (saídas ligadas via
//    MovimentacaoEstoque.OrigemId = LoteCesta.Id, OrigemTipo = MontagemCesta).
//  - Origem=Doacao: cesta fechada recebida; pertence a uma Doacao (doador via Doacao.IdDoador).
public class LoteCesta : FullAuditableEntity
{
    public int IdParoquia { get; set; }
    public OrigemCesta Origem { get; set; }
    public int? IdConfiguracaoCesta { get; set; }
    public int? IdDoacao { get; set; }
    public int Quantidade { get; set; }
    public int QuantidadeDisponivel { get; set; }
    public string? Observacao { get; set; }

    public Paroquia Paroquia { get; set; } = null!;
    public ConfiguracaoCesta? ConfiguracaoCesta { get; set; }
    public Doacao? Doacao { get; set; }
}
