using Caritas.Models.Constants;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
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
    RoleManager<Perfil> roleManager,
    ICurrentSession currentSession,
    IConfiguration configuration,
    IEmailService emailService) : BaseApiController
{
    private readonly UsuariosService _usuarioService =
        new(new UsuarioRepository(context), userManager, roleManager, currentSession, configuration, emailService);

    [HttpGet]
    [Authorize(Policy = Permissions.Usuario.Visualizar)]
    public async Task<IActionResult> GetPaged([FromQuery] UsuarioPagedRequestDto request)
    {
        var result = await _usuarioService.GetPagedAsync(request);
        return Ok(result);
    }

    [HttpGet("select")]
    [Authorize(Policy = Permissions.Usuario.Visualizar)]
    public async Task<IActionResult> GetSelect()
    {
        var paroquiaId = ParoquiaAtualId
            ?? throw new InvalidOperationException("Nenhuma paróquia selecionada.");
        var result = await _usuarioService.GetSelectByParoquiaAsync(paroquiaId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Policy = Permissions.Usuario.Visualizar)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _usuarioService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.Usuario.CriarEditar)]
    public async Task<IActionResult> Create([FromBody] CreateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _usuarioService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = Permissions.Usuario.CriarEditar)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUsuarioDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _usuarioService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = Permissions.Usuario.CriarEditar)]
    public async Task<IActionResult> Deactivate(int id)
    {
        await _usuarioService.DeactivateAsync(id);
        return NoContent();
    }
}
