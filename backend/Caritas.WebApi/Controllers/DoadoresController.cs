using Caritas.Models.Constants;
using Caritas.Models.DTOs.Doador;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class DoadoresController(IDoadorService doadorService) : BaseApiController
{
    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetPaged([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await doadorService.GetPagedAsync(page, pageSize));

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetById(int id) => Ok(await doadorService.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Create([FromBody] DoadorCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await doadorService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Update(int id, [FromBody] DoadorUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await doadorService.UpdateAsync(id, dto));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Delete(int id)
    {
        await doadorService.DeleteAsync(id);
        return NoContent();
    }
}
