using Caritas.Models.Constants;
using Caritas.Models.DTOs.Doacao;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class DoacoesController(IDoacaoService doacaoService) : BaseApiController
{
    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await doacaoService.GetPagedAsync(page, pageSize));

    [HttpPost]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Registrar([FromBody] DoacaoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await doacaoService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(GetPaged), new { id = result.Id }, result);
    }

    [HttpPost("cestas")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> RegistrarCestas([FromBody] DoacaoCestaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await doacaoService.RegistrarCestasAsync(dto);
        return CreatedAtAction(nameof(GetPaged), new { id = result.Id }, result);
    }
}
