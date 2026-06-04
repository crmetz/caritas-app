using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class UsuariosController : BaseApiController
{
    private readonly UsuariosService _usuarioService;

    public UsuariosController(CaritasDbContext context)
    {
        _usuarioService = new UsuariosService(new UsuarioRepository(context));
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
           [FromQuery] int page = 1,
           [FromQuery] int pageSize = 10)
    {
        var result = await _usuarioService.GetPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var result = await _usuarioService.GetByIdAsync(id);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _usuarioService.UpdateAsync(id, dto);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
        catch (Exception ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try
        {
            await _usuarioService.DeactivateAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }
}