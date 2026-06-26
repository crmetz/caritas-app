using Caritas.Models.Constants;
using Caritas.Models.DTOs.ConfiguracaoCesta;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
[Route("api/configuracoes-cesta")]
public class ConfiguracoesCestaController(IConfiguracaoCestaService service) : BaseApiController
{
    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        => Ok(await service.GetPagedAsync(page, pageSize));

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetById(int id) => Ok(await service.GetByIdAsync(id));

    [HttpPost]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Create([FromBody] ConfiguracaoCestaCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Update(int id, [FromBody] ConfiguracaoCestaUpdateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        return Ok(await service.UpdateAsync(id, dto));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Delete(int id)
    {
        await service.DeleteAsync(id);
        return NoContent();
    }
}
