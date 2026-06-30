using Caritas.Models.Constants;
using Caritas.Models.DTOs.Entrega;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class EntregasController(IEntregaService entregaService) : BaseApiController
{
    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? busca = null,
        [FromQuery] string? sortKey = null, [FromQuery] string? sortDir = null)
        => Ok(await entregaService.GetPagedAsync(page, pageSize, busca, sortKey, sortDir));

    [HttpPost]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Registrar([FromBody] EntregaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await entregaService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(GetPaged), new { id = result.Id }, result);
    }
}
