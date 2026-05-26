using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.services;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

public class UsuariosController : BaseApiController
{
    private readonly UsuariosService _usuarioService;

    public UsuariosController(CaritasDbContext context, IEmailService emailService)
    {
        _usuarioService = new UsuariosService(new UsuarioRepository(context), emailService);
    }

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _usuarioService.GetPagedAsync(page, pageSize);
        return Ok(result);
    }


    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUsuarioDto usuarioCreateDTO)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _usuarioService.CreateAsync(usuarioCreateDTO);

            return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _usuarioService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioDto updateUsuarioDto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _usuarioService.UpdateAsync(id, updateUsuarioDto);
            return Ok(result);
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