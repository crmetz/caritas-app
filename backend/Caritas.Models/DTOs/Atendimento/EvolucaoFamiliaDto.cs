using Caritas.Models.Enums;

namespace Caritas.Models.DTOs.Atendimento;

public class EvolucaoFamiliaDto
{
    public int FamiliaId { get; set; }
    public string FamiliaResponsavelNome { get; set; } = string.Empty;

    public int TotalAtendimentos { get; set; }
    public DateOnly? PrimeiroAtendimento { get; set; }
    public DateOnly? UltimoAtendimento { get; set; }
    public SituacaoGeralFamilia? SituacaoAtual { get; set; }

    public decimal? RendaInicial { get; set; }
    public decimal? RendaAtual { get; set; }
    public decimal? VariacaoRenda { get; set; }

    public List<EvolucaoPontoDto> Pontos { get; set; } = [];
}

public class EvolucaoPontoDto
{
    public DateOnly Data { get; set; }
    public decimal? RendaFamiliarMomento { get; set; }
    public int? QtdMembrosTrabalhando { get; set; }
    public SituacaoGeralFamilia? SituacaoGeral { get; set; }
    public string Relato { get; set; } = string.Empty;
}
