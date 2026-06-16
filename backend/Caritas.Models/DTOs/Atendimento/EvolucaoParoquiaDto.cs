using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Atendimento;

public class EvolucaoParoquiaDto
{
    public int TotalFamiliasComAtendimento { get; set; }
    public List<SituacaoContagemDto> DistribuicaoAtual { get; set; } = [];
    public List<EvolucaoParoquiaPontoDto> Serie { get; set; } = [];
}

public class SituacaoContagemDto
{
    public SituacaoGeralFamilia? Situacao { get; set; }
    public int Quantidade { get; set; }
}

public class EvolucaoParoquiaPontoDto
{
    public string Periodo { get; set; } = string.Empty; // yyyy-MM
    public int Critica { get; set; }
    public int Estavel { get; set; }
    public int EmEvolucao { get; set; }
    public int Superada { get; set; }
}
