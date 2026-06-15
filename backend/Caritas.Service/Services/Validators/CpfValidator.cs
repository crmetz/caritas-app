namespace Caritas.Service.Validators;

public static class CpfValidator
{
    public static bool Validate(string cpf)
    {
       if (string.IsNullOrWhiteSpace(cpf)) return false;

        // Remove caracteres não numéricos
        cpf = new string(cpf.Where(char.IsDigit).ToArray());

        // CPF deve conter exatamente 11 dígitos
        if (cpf.Length != 11) return false;

        // Elimina CPFs conhecidos por serem inválidos (todos os números iguais)
        if (new string(cpf[0], 11) == cpf) return false;

        // Cálculo do primeiro dígito verificador
        int[] multiplicador1 = new int[9] { 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        string tempCpf = cpf.Substring(0, 9);
        int soma = 0;

        for (int i = 0; i < 9; i++)
            soma += int.Parse(tempCpf[i].ToString()) * multiplicador1[i];

        int resto = soma % 11;
        resto = resto < 2 ? 0 : 11 - resto;

        string digito = resto.ToString();

        // Cálculo do segundo dígito verificador
        int[] multiplicador2 = new int[10] { 11, 10, 9, 8, 7, 6, 5, 4, 3, 2 };
        tempCpf = cpf.Substring(0, 9) + digito;
        soma = 0;

        for (int i = 0; i < 10; i++)
            soma += int.Parse(tempCpf[i].ToString()) * multiplicador2[i];

        resto = soma % 11;
        resto = resto < 2 ? 0 : 11 - resto;

        digito += resto.ToString();

        // Verifica se os dígitos calculados batem com os dígitos informados
        return cpf.EndsWith(digito);


    }
}