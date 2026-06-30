using Caritas.Models.Constants;
using Caritas.Models.DTOs.Paroquia;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service.services;
using Caritas.Service.Session;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers
{
    [Authorize]
    public class ParoquiasController(
        CaritasDbContext context,
        UserManager<Usuario> userManager,
        ICurrentSession currentSession) : BaseApiController
    {
        private readonly ParoquiaService _paroquiaService =
            new(new ParoquiaRepository(context), userManager, currentSession, new UsuarioRepository(context));

        [HttpGet]
        [Authorize(Policy = Permissions.Paroquia.Visualizar)]
        public async Task<IActionResult> GetPaged([FromQuery] ParoquiaPagedRequestDto request)
        {
            var result = await _paroquiaService.GetPagedAsync(request);
            return Ok(result);
        }

        [HttpGet("select")]
        [Authorize(Policy = Permissions.Paroquia.Visualizar)]
        public async Task<IActionResult> GetAllSelectObject()
        {
            var result = await _paroquiaService.GetAllSelectObject();
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Policy = Permissions.Paroquia.Visualizar)]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _paroquiaService.GetByIdAsync(id);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = Permissions.Paroquia.CriarEditar)]
        public async Task<IActionResult> Create([FromBody] CreateParoquiaDTO paroquiaCreateDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _paroquiaService.CreateAsync(paroquiaCreateDTO);
            return CreatedAtAction(nameof(Create), new { id = result.Id }, result);
        }

        [HttpPut("{id}")]
        [Authorize(Policy = Permissions.Paroquia.CriarEditar)]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateParoquiaDto updateParoquiaDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _paroquiaService.UpdateAsync(id, updateParoquiaDto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Paroquia.CriarEditar)]
        public async Task<IActionResult> Delete(int id)
        {
            await _paroquiaService.DeleteAsync(id);
            return NoContent();
        }
    }
}
