namespace Caritas.Service.Validators;

using System.Text.RegularExpressions;

public static class CepValidator
{
    public static bool Validate(string cep)
    {
        if (string.IsNullOrWhiteSpace(cep))
            return false;

        string padrao = @"^\d{5}-?\d{3}$";
        return Regex.IsMatch(cep, padrao);

    }
}