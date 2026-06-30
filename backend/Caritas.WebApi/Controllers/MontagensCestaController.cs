using Caritas.Models.Constants;
using Caritas.Models.DTOs.Montagem;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
[Route("api/montagens-cesta")]
public class MontagensCestaController(IMontagemCestaService service) : BaseApiController
{
    [HttpPost("simular")]
    public async Task<IActionResult> Simular([FromBody] MontagemSimularDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await service.SimularAsync(dto));
    }

    [HttpPost]
    public async Task<IActionResult> Confirmar([FromBody] MontagemConfirmarDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await service.ConfirmarAsync(dto);
        return CreatedAtAction(nameof(Confirmar), new { id = result.Id }, result);
    }
}
