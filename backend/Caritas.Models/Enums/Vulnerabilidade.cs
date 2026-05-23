namespace Caritas.Models.Enums;

[Flags]
public enum Vulnerabilidade
{
    Nenhuma              = 0,
    Desemprego           = 1 << 0,
    InsegurancaAlimentar = 1 << 1,
    ViolenciaDomestica   = 1 << 2,
    MoradiaPrecaria      = 1 << 3,
    Deficiencia          = 1 << 4,
    DependenciaQuimica   = 1 << 5,
}
