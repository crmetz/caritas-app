using Caritas.Models.Enums;

namespace Caritas.Models.Entities;

// Gênero alimentício (Arroz, Feijão, Farinha...). O nome do gênero fica em Descricao (herdado);
// o tamanho do pacote e a validade são coordenadas de lote em Estoque/MovimentacaoEstoque.
public class Alimento : Item
{
    public Alimento() { Tipo = TipoItem.Alimento; }

    public FormaMedida FormaMedida { get; set; }
}
