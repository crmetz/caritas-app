using Caritas.Models.Constants;
using Caritas.Models.DTOs.Bazar;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;


namespace Caritas.WebApi.Controllers;

[Authorize]
[Route("api/bazar")]
public class BazarController(CaritasDbContext context) : BaseApiController
{
    private readonly BazarService _bazarService = new(context);

    [HttpGet("pecas")]
    [Authorize(Policy = Permissions.Bazar.Visualizar)]
    public async Task<IActionResult> GetPecas(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _bazarService.GetPecasPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpPost("pecas")]
    [Authorize(Policy = Permissions.Bazar.RegistrarVenda)]
    public async Task<IActionResult> CreatePeca([FromBody] PecaCreateDto dto)
    {
        var result = await _bazarService.CreatePecaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPut("pecas/{id:int}")]
    [Authorize(Policy = Permissions.Bazar.RegistrarVenda)]
    public async Task<IActionResult> UpdatePeca(int id, [FromBody] PecaUpdateDto dto)
    {
        var result = await _bazarService.UpdatePecaAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("pecas/{id:int}")]
    [Authorize(Policy = Permissions.Bazar.RegistrarVenda)]
    public async Task<IActionResult> DeletePeca(int id)
    {
        await _bazarService.DeletePecaAsync(id);
        return NoContent();
    }

    [HttpGet("vendas")]
    [Authorize(Policy = Permissions.Bazar.Relatorio)]
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
    [Authorize(Policy = Permissions.Bazar.RegistrarVenda)]
    public async Task<IActionResult> CreateVenda([FromBody] VendaBazarCreateDto dto)
    {
        var result = await _bazarService.CreateVendaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPost("vendas/{id:int}/cancelar")]
    [Authorize(Policy = Permissions.Bazar.RegistrarVenda)]
    public async Task<IActionResult> CancelarVenda(int id, [FromBody] CancelarVendaBazarDto dto)
    {
        await _bazarService.CancelarVendaAsync(id, dto);
        return NoContent();
    }

    [HttpGet("relatorio")]
    [Authorize(Policy = Permissions.Bazar.Relatorio)]
    public async Task<IActionResult> GetRelatorio(
        [FromQuery] DateTime dataInicio,
        [FromQuery] DateTime dataFim)
    {
        var result = await _bazarService.GetRelatorioAsync(dataInicio, dataFim);
        return Ok(result);
    }
}
