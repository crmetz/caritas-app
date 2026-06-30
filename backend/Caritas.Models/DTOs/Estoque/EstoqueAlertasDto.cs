namespace Caritas.Models.DTOs.Estoque;

// Contagens agregadas de validade do estoque de alimentos (independem da paginação da lista).
public class EstoqueAlertasDto
{
    public int Vencidos { get; set; }
    public int Proximos { get; set; } // a vencer em até 30 dias
}
