using System.Reflection;
using Caritas.Models.Constants;
using Caritas.Models.DTOs.Permission;

namespace Caritas.Service.Services;

public class PermissionService
{
    private static readonly Dictionary<string, string> ModuleLabels = new()
    {
        ["usuario"] = "Usuários",
        ["paroquia"] = "Paróquias",
        ["perfil"] = "Perfis",
    };

    private static readonly Dictionary<string, string> ActionLabels = new()
    {
        ["visualizar"] = "Visualizar",
        ["criarEditar"] = "Criar e Editar",
    };

    public static readonly IReadOnlyList<PermissionModuleDto> Catalog = BuildCatalog();

    /// Todos os valores de permissão válidos
    public static IEnumerable<string> AllValues =>
        Catalog.SelectMany(m => m.Permissions.Select(p => p.Value));

    public IReadOnlyList<PermissionModuleDto> GetCatalog() => Catalog;

    private static List<PermissionModuleDto> BuildCatalog()
    {
        var moduleOrder = ModuleLabels.Keys.ToList();
        var actionOrder = ActionLabels.Keys.ToList();

        var values = typeof(Permissions)
            .GetNestedTypes()
            .SelectMany(t => t.GetFields(BindingFlags.Public | BindingFlags.Static))
            .Where(f => f is { IsLiteral: true } && f.FieldType == typeof(string))
            .Select(f => (string)f.GetRawConstantValue()!);

        return values
            .GroupBy(v => v.Split('.')[0])
            .OrderBy(g => moduleOrder.IndexOf(g.Key))
            .Select(g => new PermissionModuleDto
            {
                Module = LabelFor(ModuleLabels, g.Key),
                Permissions = g
                    .OrderBy(v => actionOrder.IndexOf(v.Split('.')[1]))
                    .Select(v => new PermissionItemDto
                    {
                        Value = v,
                        Label = LabelFor(ActionLabels, v.Split('.')[1]),
                    })
                    .ToList(),
            })
            .ToList();
    }

    private static string LabelFor(IReadOnlyDictionary<string, string> labels, string key) =>
        labels.TryGetValue(key, out var label) ? label : key;
}
