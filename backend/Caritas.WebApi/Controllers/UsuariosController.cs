using Caritas.Models.DTOs.Usuario;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.Services;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

public class UsuariosController(CaritasDbContext context) : BaseApiController
{
    private readonly CaritasDbContext _context = context;
    private readonly UsuarioService _service = new(new UsuarioRepository(context));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UsuarioCreateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var usuario = await _service.CreateAsync(dto);

            return CreatedAtAction(nameof(Create), new { id = usuario.Id }, new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Sobrenome,
                usuario.Email,
                usuario.Telefone,
                usuario.DataNasc,
                usuario.PerfilId,
                usuario.DataCriacao
            });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensagem = ex.Message });
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var usuario = await new UsuarioRepository(_context).GetByIdAsync(id);

        if (usuario is null)
            return NotFound(new { mensagem = $"Usuário com id {id} não encontrado." });

        return Ok(new
        {
            usuario.Id,
            usuario.Nome,
            usuario.Sobrenome,
            usuario.Email,
            usuario.Telefone,
            usuario.DataNasc,
            usuario.PerfilId,
            usuario.DataCriacao
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UsuarioUpdateDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var usuario = await _service.UpdateAsync(id, dto);
            return Ok(new
            {
                usuario.Id,
                usuario.Nome,
                usuario.Sobrenome,
                usuario.Email,
                usuario.Telefone,
                usuario.DataNasc,
                usuario.PerfilId,
                usuario.DataCriacao
            });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Deactivate(int id)
    {
        try
        {
            await _service.DeactivateAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { mensagem = ex.Message });
        }
    }
}