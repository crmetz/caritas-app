using Caritas.Models.Common;
using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

// Registro único de doação recebida (mono-tipo):
//  - Tipo=Itens: conteúdo = suas MovimentacaoEstoque (origemTipo=Doacao).
//  - Tipo=CestasFechadas: conteúdo = seus LoteCesta (Origem=Doacao, IdDoacao).
public class Doacao : FullAuditableEntity
{
    public int IdDoador { get; set; }
    public int IdParoquia { get; set; }
    public TipoDoacao Tipo { get; set; }
    public string? Observacao { get; set; }

    public Doador Doador { get; set; } = null!;
    public Paroquia Paroquia { get; set; } = null!;
}
