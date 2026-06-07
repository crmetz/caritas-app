using Caritas.Models.DTOs.Brecho;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Route("api/brecho")]
public class BrechoController(CaritasDbContext context) : BaseApiController
{
    private readonly BrechoService _brechoService = new(context);

    [HttpGet("pecas")]
    public async Task<IActionResult> GetPecas(
        [FromQuery] int paroquiaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _brechoService.GetPecasPagedAsync(paroquiaId, page, pageSize);
        return Ok(result);
    }

    [HttpPost("pecas")]
    public async Task<IActionResult> CreatePeca([FromBody] PecaBrechoCreateDto dto)
    {
        var result = await _brechoService.CreatePecaAsync(dto);
        return Created(string.Empty, result);
    }

    [HttpPut("pecas/{id:int}")]
    public async Task<IActionResult> UpdatePeca(int id, [FromBody] PecaBrechoCreateDto dto)
    {
        var result = await _brechoService.UpdatePecaAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("pecas/{id:int}")]
    public async Task<IActionResult> DeletePeca(int id)
    {
        await _brechoService.DeletePecaAsync(id);
        return NoContent();
    }

    [HttpPost("vendas")]
    public async Task<IActionResult> CreateVenda([FromBody] VendaBrechoCreateDto dto)
    {
        await _brechoService.CreateVendaAsync(dto);
        return Created(string.Empty, null);
    }
}
