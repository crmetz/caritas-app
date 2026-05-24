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

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var paroquia = await _paroquiaService.GetByIdAsync(id);

            if (paroquia == null) 
            {
                return NotFound(new { mensagem = $"Paróquia com id {id} não encontrada." });
            }

            return Ok(
                new {
                    paroquia.Id,
                    paroquia.Nome,
                    paroquia.Endereco,
                    paroquia.UsuarioParoquias
                }
            );
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ParoquiaCreateDTO paroquiaCreateDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var paroquia = await _paroquiaService.CreateAsync(paroquiaCreateDTO);

                return CreatedAtAction(nameof(Create), new { id = paroquia.Id }, new
                {
                    paroquia.Id,
                    paroquia.Nome,
                    paroquia.Endereco,
                    paroquia.UsuarioParoquias
                });
            }
            catch (Exception ex)
            {
                return Conflict(new { mensagem = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] ParoquiaUpdateDTO paroquiaUpdateDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var paroquia = await _paroquiaService.UpdateAsync(id, paroquiaUpdateDTO);
                return Ok(new
                {
                    paroquia.Id,
                    paroquia.Nome,
                    paroquia.Endereco,
                    paroquia.UsuarioParoquias
                });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id) {
            try
            {
                await _paroquiaService.DeleteAsync(id);
                return NoContent();
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { mensagem = ex.Message });
            }
        }
    }
}
