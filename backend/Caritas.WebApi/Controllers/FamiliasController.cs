using Caritas.Models.DTOs.Familia;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

public class FamiliasController(CaritasDbContext context) : BaseApiController
{
    private readonly FamiliaService _familiaService = new(context);

    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var result = await _familiaService.GetPagedAsync(page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _familiaService.GetByIdAsync(id);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FamiliaCreateDto dto)
    {
        var result = await _familiaService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] FamiliaUpdateDto dto)
    {
        var result = await _familiaService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await _familiaService.DeleteAsync(id);
        return NoContent();
    }
}
