using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Services;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class UsuariosController(
    CaritasDbContext context,
    UserManager<Usuario> userManager,
    ICurrentSession currentSession) : BaseApiController
{
    private readonly UsuariosService _usuarioService =
        new(new UsuarioRepository(context), userManager, currentSession);

    [HttpGet]
    public async Task<IActionResult> GetPaged([FromQuery] UsuarioPagedRequestDto request)
    {
        var result = await _usuarioService.GetPagedAsync(request);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _usuarioService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _usuarioService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _usuarioService.DeactivateAsync(id);
        return NoContent();
    }
}
