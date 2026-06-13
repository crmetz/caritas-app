namespace Caritas.Service.Validators;

public static class PhoneValidator
{
    public static bool Validate(string phone)
    {
        // remove caracteres não numéricos
        var nums = new string(phone.Where(char.IsDigit).ToArray());

        // telefone brasileiro: 10 dígitos (fixo) ou 11 dígitos (celular)
        if (nums.Length != 10 && nums.Length != 11)
            return false;

        // DDD válido (11 a 99)
        var ddd = int.Parse(nums[..2]);
        if (ddd < 11 || ddd > 99)
            return false;

        // celular começa com 9
        if (nums.Length == 11 && nums[2] != '9')
            return false;

        return true;
    }
}