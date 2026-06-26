using Caritas.Models.Constants;
using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class MovimentacoesController(IMovimentacaoService movimentacaoService) : BaseApiController
{
    [HttpPost]
    [Authorize(Policy = Permissions.Suprimentos.CriarEditar)]
    public async Task<IActionResult> Registrar([FromBody] MovimentacaoCreateDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var result = await movimentacaoService.RegistrarAsync(dto);
        return CreatedAtAction(nameof(Registrar), new { id = result.Id }, result);
    }

    [HttpGet]
    [Authorize(Policy = Permissions.Suprimentos.Visualizar)]
    public async Task<IActionResult> GetHistorico(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10,
        [FromQuery] int? idItem = null, [FromQuery] int? idParoquia = null,
        [FromQuery] OrigemMovimentacao? origemTipo = null)
        => Ok(await movimentacaoService.GetHistoricoAsync(page, pageSize, idItem, idParoquia, origemTipo));
}
