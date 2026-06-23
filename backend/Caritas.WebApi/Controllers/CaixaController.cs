using Caritas.Models.DTOs.Caixa;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Route("api/caixa")]
public class CaixaController(CaritasDbContext context) : BaseApiController
{
    private readonly CaixaService _caixaService = new(context);

    [HttpGet("{paroquiaId:int}/lancamentos")]
    public async Task<IActionResult> GetLancamentos(
        int paroquiaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15)
    {
        var result = await _caixaService.GetLancamentosAsync(paroquiaId, page, pageSize);
        return Ok(result);
    }

    [HttpPost("lancamentos/entrada")]
    public async Task<IActionResult> CreateEntrada([FromBody] CreateEntradaDto dto)
    {
        var result = await _caixaService.CreateEntradaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPost("lancamentos/saida")]
    public async Task<IActionResult> CreateSaida([FromBody] CreateSaidaDto dto)
    {
        var result = await _caixaService.CreateSaidaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPost("lancamentos/{id:int}/cancelar")]
    public async Task<IActionResult> CancelarLancamento(int id, [FromBody] CancelarLancamentoDto dto)
    {
        await _caixaService.CancelarLancamentoAsync(id, dto);
        return NoContent();
    }

    [HttpGet("{paroquiaId:int}/saldo")]
    public async Task<IActionResult> GetSaldo(int paroquiaId)
    {
        var result = await _caixaService.GetSaldoAsync(paroquiaId);
        return Ok(result);
    }

    [HttpGet("{paroquiaId:int}/relatorio")]
    public async Task<IActionResult> GetRelatorio(
        int paroquiaId,
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime dataFim)
    {
        var result = await _caixaService.GetRelatorioAsync(paroquiaId, dataInicio, dataFim);
        return Ok(result);
    }
}
