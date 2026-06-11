using Caritas.Models.DTOs.FamiliaCidade;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

public class FamiliaCidadesController(CaritasDbContext context) : BaseApiController
{
    private readonly FamiliaCidadeService _cidadeService = new(context);

    [HttpGet("select")]
    public async Task<IActionResult> GetAllSelect()
    {
        var result = await _cidadeService.GetAllSelectAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FamiliaCidadeCreateDto dto)
    {
        var result = await _cidadeService.CreateAsync(dto);
        return Ok(result);
    }
}
