using System.Globalization;
using Caritas.Models.Enums;

namespace Caritas.Service;

// Isola a regra de "qual unidade usar". Converte o que o usuário digita (ex.: 1 "kg") para a
// unidade-base do gênero (g/ml/un) e formata um total na unidade mais legível.
public static class MedidaHelper
{
    private static readonly CultureInfo Pt = CultureInfo.GetCultureInfo("pt-BR");

    // Unidades válidas por forma de medida e seu fator para a unidade-base.
    private static readonly Dictionary<FormaMedida, Dictionary<string, int>> Fatores = new()
    {
        [FormaMedida.Peso] = new(StringComparer.OrdinalIgnoreCase) { ["g"] = 1, ["kg"] = 1000, ["t"] = 1_000_000 },
        [FormaMedida.Volume] = new(StringComparer.OrdinalIgnoreCase) { ["ml"] = 1, ["l"] = 1000 },
        [FormaMedida.Unidade] = new(StringComparer.OrdinalIgnoreCase) { ["un"] = 1, ["unidade"] = 1 },
    };

    // Converte valor+unidade para a unidade-base. Valida a unidade contra a forma de medida.
    public static int ParaBase(decimal valor, string unidade, FormaMedida forma)
    {
        if (valor <= 0)
            throw new ArgumentException("O tamanho deve ser positivo.");

        var unid = (unidade ?? string.Empty).Trim();
        if (!Fatores[forma].TryGetValue(unid, out var fator))
            throw new ArgumentException(
                $"Unidade '{unidade}' inválida para medida por {forma}. Válidas: {string.Join(", ", Fatores[forma].Keys)}.");

        var baseValor = valor * fator;
        if (baseValor != Math.Floor(baseValor))
            throw new ArgumentException("O tamanho na unidade-base deve ser inteiro (ex.: use g/ml em vez de frações).");

        return (int)baseValor;
    }

    // Formata um total (na unidade-base) escolhendo a unidade mais adequada.
    public static string Formatar(long totalBase, FormaMedida forma) => forma switch
    {
        FormaMedida.Peso => totalBase < 1000 ? $"{totalBase} g"
            : totalBase < 1_000_000 ? $"{Num(totalBase / 1000m)} kg"
            : $"{Num(totalBase / 1_000_000m)} t",
        FormaMedida.Volume => totalBase < 1000 ? $"{totalBase} ml"
            : $"{Num(totalBase / 1000m)} L",
        _ => $"{totalBase} un",
    };

    private static string Num(decimal v) => v.ToString("0.##", Pt);
}
