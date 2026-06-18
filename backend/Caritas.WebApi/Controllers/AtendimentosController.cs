using Caritas.Models.Constants;
using Caritas.Models.DTOs.Atendimento;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class AtendimentosController(CaritasDbContext context) : BaseApiController
{
    private readonly AtendimentoService _atendimentoService = new(context);

    [HttpGet]
    [Authorize(Policy = Permissions.Atendimento.Visualizar)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] AtendimentoFilterDto? filter = null)
    {
        var result = await _atendimentoService.GetPagedAsync(page, pageSize, filter ?? new AtendimentoFilterDto());
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.Atendimento.Visualizar)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _atendimentoService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpGet("evolucao/{familiaId:int}")]
    [Authorize(Policy = Permissions.Atendimento.VisualizarEvolucao)]
    public async Task<IActionResult> GetEvolucao(int familiaId)
    {
        var paroquiaAtualId = ParoquiaAtualId
            ?? throw new InvalidOperationException("Nenhuma paróquia selecionada.");
        var result = await _atendimentoService.GetEvolucaoAsync(familiaId, paroquiaAtualId);
        return Ok(result);
    }

    [HttpGet("evolucao-paroquia")]
    [Authorize(Policy = Permissions.Atendimento.VisualizarEvolucao)]
    public async Task<IActionResult> GetEvolucaoParoquia()
    {
        var paroquiaAtualId = ParoquiaAtualId
            ?? throw new InvalidOperationException("Nenhuma paróquia selecionada.");
        var result = await _atendimentoService.GetEvolucaoParoquiaAsync(paroquiaAtualId);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.Atendimento.CriarEditar)]
    public async Task<IActionResult> Create([FromBody] AtendimentoCreateDto dto)
    {
        var paroquiaAtualId = ParoquiaAtualId
            ?? throw new InvalidOperationException("Nenhuma paróquia selecionada.");
        var result = await _atendimentoService.CreateAsync(dto, UsuarioId, paroquiaAtualId);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.Atendimento.CriarEditar)]
    public async Task<IActionResult> Update(int id, [FromBody] AtendimentoUpdateDto dto)
    {
        var result = await _atendimentoService.UpdateAsync(id, dto, UsuarioId);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Atendimento.CriarEditar)]
    public async Task<IActionResult> Delete(int id)
    {
        await _atendimentoService.DeleteAsync(id);
        return NoContent();
    }
}
