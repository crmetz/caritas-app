using Caritas.Models.Constants;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize(Policy = Permissions.Suprimentos.Visualizar)]
public class EstoqueController(IEstoqueService estoqueService) : BaseApiController
{
    [HttpGet("alimentos")]
    public async Task<IActionResult> GetAlimentos(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? busca = null,
        [FromQuery] DateOnly? validadeDe = null, [FromQuery] DateOnly? validadeAte = null,
        [FromQuery] string? sortKey = null, [FromQuery] string? sortDir = null)
        => Ok(await estoqueService.GetAlimentosAsync(
            page, pageSize, busca, validadeDe, validadeAte, sortKey, sortDir));

    [HttpGet("alimentos/alertas")]
    public async Task<IActionResult> GetAlimentosAlertas()
        => Ok(await estoqueService.GetAlimentosAlertasAsync());

    [HttpGet("roupas")]
    public async Task<IActionResult> GetRoupas(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? busca = null,
        [FromQuery] CategoriaRoupa? categoria = null, [FromQuery] CondicaoRoupa? condicao = null,
        [FromQuery] string? sortKey = null, [FromQuery] string? sortDir = null)
        => Ok(await estoqueService.GetRoupasAsync(page, pageSize, busca, categoria, condicao, sortKey, sortDir));

    [HttpGet("alimentos/resumo")]
    public async Task<IActionResult> GetResumoAlimentos()
        => Ok(await estoqueService.GetResumoAlimentosAsync());
}
