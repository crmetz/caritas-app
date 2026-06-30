namespace Caritas.Models.Constants;

public static class Permissions
{
    public const string ClaimType = "permission";

    public static class Usuario
    {
        public const string Visualizar = "usuario.visualizar";
        public const string CriarEditar = "usuario.criarEditar";
    }

    public static class Paroquia
    {
        public const string Visualizar = "paroquia.visualizar";
        public const string CriarEditar = "paroquia.criarEditar";
    }

    public static class Perfil
    {
        public const string Visualizar = "perfil.visualizar";
        public const string CriarEditar = "perfil.criarEditar";
    }

    public static class Atendimento
    {
        public const string Visualizar = "atendimento.visualizar";
        public const string CriarEditar = "atendimento.criarEditar";
        public const string VisualizarEvolucao = "atendimento.visualizarEvolucao";
    }

    public static class Familia
    {
        public const string Visualizar = "familia.visualizar";
        public const string CriarEditar = "familia.criarEditar";
    }

    public static class Bazar
    {
        public const string Visualizar = "bazar.visualizar";
        public const string RegistrarVenda = "bazar.registrarVenda";
        public const string Relatorio = "bazar.relatorio";
    }

    public static class Brecho
    {
        public const string Visualizar = "brecho.visualizar";
        public const string RegistrarVenda = "brecho.registrarVenda";
        public const string Historico = "brecho.historico";
    }

    public static class Caixa
    {
        public const string Visualizar = "caixa.visualizar";
        public const string Lancar = "caixa.lancar";
        public const string Relatorio = "caixa.relatorio";
    }

    public static class Suprimentos
    {
        public const string Visualizar = "suprimentos.visualizar";
        public const string CriarEditar = "suprimentos.criarEditar";
    }
}
