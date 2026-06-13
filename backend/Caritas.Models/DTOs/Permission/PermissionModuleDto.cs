namespace Caritas.Models.DTOs.Permission;

public class PermissionModuleDto
{
    public string Module { get; set; } = string.Empty;

    public List<PermissionItemDto> Permissions { get; set; } = new();
}

public class PermissionItemDto
{
    public string Value { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;
}
