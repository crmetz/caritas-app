using Caritas.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class PermissoesController : BaseApiController
{
    private readonly PermissionService _permissionService = new();

    [HttpGet]
    public IActionResult GetCatalog()
    {
        return Ok(_permissionService.GetCatalog());
    }
}
