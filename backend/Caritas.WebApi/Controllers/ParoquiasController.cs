using Caritas.Models.DTOs.Paroquia;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.services;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers
{
    public class ParoquiasController : BaseApiController
    {
        private readonly ParoquiaService _paroquiaService;
        public ParoquiasController(CaritasDbContext context) { 
            _paroquiaService = new ParoquiaService(new ParoquiaRepository(context));
        }

        [HttpGet]
        public async Task<IActionResult> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var result = await _paroquiaService.GetPagedAsync(page, pageSize);
            return Ok(result);
        }

        [HttpGet("select")]
        public async Task<IActionResult> GetAllSelectObject()
        {
            var result = await _paroquiaService.GetAllSelectObject();
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _paroquiaService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateParoquiaDTO paroquiaCreateDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var result = await _paroquiaService.CreateAsync(paroquiaCreateDTO);

                return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return Conflict(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateParoquiaDto updateParoquiaDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _paroquiaService.UpdateAsync(id, updateParoquiaDto);
            return Ok(result);

        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id) {

            await _paroquiaService.DeleteAsync(id);
            return NoContent();
        }
    }
}
