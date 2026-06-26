using Caritas.Models.Constants;
using Caritas.Models.DTOs.Item;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class ItensController(IItemService itemService) : BaseApiController
{
    [HttpPost("alimentos")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> CreateAlimento([FromBody] AlimentoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await itemService.CreateAlimentoAsync(dto);
        return CreatedAtAction(nameof(CreateAlimento), new { id = result.Id }, result);
    }

    [HttpPut("alimentos/{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> UpdateAlimento(int id, [FromBody] AlimentoUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await itemService.UpdateAlimentoAsync(id, dto));
    }

    [HttpPost("roupas")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> CreateRoupa([FromBody] RoupaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await itemService.CreateRoupaAsync(dto);
        return CreatedAtAction(nameof(CreateRoupa), new { id = result.Id }, result);
    }

    [HttpPut("roupas/{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> UpdateRoupa(int id, [FromBody] RoupaUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await itemService.UpdateRoupaAsync(id, dto));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Delete(int id)
    {
        await itemService.DeleteAsync(id);
        return NoContent();
    }

    [HttpGet("select")]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetSelect([FromQuery] TipoItem? tipo)
        => Ok(await itemService.GetSelectAsync(tipo));

    [HttpGet("alimentos")]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetAlimentos()
        => Ok(await itemService.GetAlimentosAsync());
}
