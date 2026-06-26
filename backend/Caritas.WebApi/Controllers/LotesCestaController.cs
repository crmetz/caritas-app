using Caritas.Models.Constants;
using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
[Route("api/lotes-cesta")]
public class LotesCestaController(ILoteCestaService service) : BaseApiController
{
    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetControle([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await service.GetControleAsync(page, pageSize));

    [HttpGet("select")]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetDisponiveisSelect()
        => Ok(await service.GetDisponiveisSelectAsync());

    [HttpPost("{id:int}/baixas")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> RegistrarBaixa(int id, [FromBody] CestaBaixaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await service.RegistrarBaixaAsync(id, dto));
    }
}
