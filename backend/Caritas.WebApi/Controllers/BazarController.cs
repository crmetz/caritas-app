using Caritas.Models.DTOs.Bazar;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Mvc;


namespace Caritas.WebApi.Controllers;

[Route("api/bazar")]
public class BazarController(CaritasDbContext context) : BaseApiController
{
    private readonly BazarService _bazarService = new(context);

    [HttpGet("pecas")]
    public async Task<IActionResult> GetPecas(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _bazarService.GetPecasPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpPost("pecas")]
    public async Task<IActionResult> CreatePeca([FromBody] PecaCreateDto dto)
    {
        var result = await _bazarService.CreatePecaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPut("pecas/{id:int}")]
    public async Task<IActionResult> UpdatePeca(int id, [FromBody] PecaUpdateDto dto)
    {
        var result = await _bazarService.UpdatePecaAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("pecas/{id:int}")]
    public async Task<IActionResult> DeletePeca(int id)
    {
        await _bazarService.DeletePecaAsync(id);
        return NoContent();
    }

    [HttpGet("vendas")]
    public async Task<IActionResult> GetVendas(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 15,
        [FromQuery] DateTime? dataInicio = null,
        [FromQuery] DateTime? dataFim = null)
    {
        var result = await _bazarService.GetVendasPagedAsync(page, pageSize, dataInicio, dataFim);
        return Ok(result);
    }

    [HttpPost("vendas")]
    public async Task<IActionResult> CreateVenda([FromBody] VendaBazarCreateDto dto)
    {
        var result = await _bazarService.CreateVendaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPost("vendas/{id:int}/cancelar")]
    public async Task<IActionResult> CancelarVenda(int id, [FromBody] CancelarVendaBazarDto dto)
    {
        await _bazarService.CancelarVendaAsync(id, dto);
        return NoContent();
    }

    [HttpGet("relatorio")]
    public async Task<IActionResult> GetRelatorio(
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime dataFim)
    {
        var result = await _bazarService.GetRelatorioAsync(dataInicio, dataFim);
        return Ok(result);
    }
}
