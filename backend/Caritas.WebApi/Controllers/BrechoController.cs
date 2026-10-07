using Caritas.Models.Constants;
using Caritas.Models.DTOs.Brecho;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
[Route("api/brecho")]
public class BrechoController(CaritasDbContext context) : BaseApiController
{
    private readonly BrechoService _brechoService = new(context);
    private readonly SessaoCaixaBrechoService _sessaoCaixaService = new(context);

    // TODO(isolamento-paroquia): paroquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet("pecas")]
    [Authorize(Policy = Permissions.Brecho.Visualizar)]
    public async Task<IActionResult> GetPecas(
        [FromQuery] int paroquiaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _brechoService.GetPecasPagedAsync(paroquiaId, page, pageSize);
        return Ok(result);
    }

    // TODO(isolamento-paroquia): dto.ParoquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpPost("pecas")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> CreatePeca([FromBody] PecaBrechoCreateDto dto)
    {
        var result = await _brechoService.CreatePecaAsync(dto);
        return Created(string.Empty, result);
    }

    // TODO(isolamento-paroquia): dto.ParoquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpPut("pecas/{id:int}")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> UpdatePeca(int id, [FromBody] PecaBrechoCreateDto dto)
    {
        var result = await _brechoService.UpdatePecaAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("pecas/{id:int}")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> DeletePeca(int id)
    {
        await _brechoService.DeletePecaAsync(id);
        return NoContent();
    }

    // TODO(isolamento-paroquia): dto.ParoquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpPost("vendas")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> CreateVenda([FromBody] VendaBrechoCreateDto dto)
    {
        var result = await _brechoService.CreateVendaAsync(dto);
        return Created(string.Empty, result);
    }

    // TODO(isolamento-paroquia): paroquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet("vendas")]
    [Authorize(Policy = Permissions.Brecho.Historico)]
    public async Task<IActionResult> GetVendas(
        [FromQuery] int paroquiaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] DateTime? abertoDesde = null,
        [FromQuery] DateTime? ateData = null)
    {
        var result = await _brechoService.GetVendasPagedAsync(paroquiaId, page, pageSize, abertoDesde, ateData);
        return Ok(result);
    }

    [HttpPost("vendas/{id:int}/cancelar")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> CancelarVenda(int id, [FromBody] CancelarVendaBrechoDto dto)
    {
        await _brechoService.CancelarVendaAsync(id, dto);
        return NoContent();
    }

    // TODO(isolamento-paroquia): paroquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet("caixa/sessao-atual")]
    [Authorize(Policy = Permissions.Brecho.Visualizar)]
    public async Task<IActionResult> GetSessaoAtual([FromQuery] int paroquiaId)
    {
        var result = await _sessaoCaixaService.GetSessaoAtualAsync(paroquiaId);
        return Ok(result);
    }

    // TODO(isolamento-paroquia): paroquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet("caixa/sessao-recente")]
    [Authorize(Policy = Permissions.Brecho.Visualizar)]
    public async Task<IActionResult> GetSessaoRecente([FromQuery] int paroquiaId)
    {
        var result = await _sessaoCaixaService.GetSessaoRecenteAsync(paroquiaId);
        return Ok(result);
    }

    // TODO(isolamento-paroquia): dto.ParoquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpPost("caixa/abrir")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> AbrirCaixa([FromBody] AbrirCaixaBrechoDto dto)
    {
        var result = await _sessaoCaixaService.AbrirCaixaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPost("caixa/{id:int}/fechar")]
    [Authorize(Policy = Permissions.Brecho.RegistrarVenda)]
    public async Task<IActionResult> FecharCaixa(int id, [FromBody] FecharCaixaBrechoDto dto)
    {
        var result = await _sessaoCaixaService.FecharCaixaAsync(id, dto);
        return Ok(result);
    }
}
