using Caritas.Models.DTOs.Perfil;
using Caritas.Models.Entities;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class PerfisController(
    RoleManager<Perfil> roleManager,
    UserManager<Usuario> userManager) : BaseApiController
{
    private readonly PerfilService _perfilService = new(roleManager, userManager);

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _perfilService.GetPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _perfilService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePerfilDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _perfilService.CreateAsync(dto);
        return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePerfilDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _perfilService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _perfilService.DeleteAsync(id);
        return NoContent();
    }
}
