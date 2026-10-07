using Caritas.Models.Constants;
using Caritas.Models.DTOs.Familia;
using Caritas.Models.DTOs.Pessoa;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[Authorize]
public class FamiliasController(
    CaritasDbContext context,
    IHistoricoFamiliaService historicoService,
    IAuthorizationService authorizationService) : BaseApiController
{
    private readonly FamiliaService _familiaService = new(context);

    // TODO(isolamento-paroquia): filter.ParoquiaId não é validado contra as paróquias do usuário e, se nulo, lista todas. Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet]
    [Authorize(Policy = Permissions.Familia.Visualizar)]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] FamiliaFilterDto? filter = null)
    {
        var result = await _familiaService.GetPagedAsync(page, pageSize, filter ?? new FamiliaFilterDto());
        return Ok(result);
    }

    // TODO(isolamento-paroquia): paroquiaId vem do cliente sem validação; usar ParoquiaAtualId (sessão). Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpGet("select")]
    public async Task<IActionResult> GetSelect([FromQuery] int? paroquiaId)
    {
        var result = await _familiaService.GetSelectAsync(paroquiaId ?? ParoquiaAtualId);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = Permissions.Familia.Visualizar)]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await _familiaService.GetByIdAsync(id);
        return Ok(result);
    }

    // Linha do tempo da família. Entregas e saídas de caixa só entram se o usuário tiver
    // permissão nesses módulos — as permissões não vêm no JWT, então são resolvidas aqui
    // pelo IAuthorizationService (mesmo handler das policies) e repassadas ao service.
    [HttpGet("{id:int}/historico")]
    [Authorize(Policy = Permissions.Familia.Visualizar)]
    public async Task<IActionResult> GetHistorico(
        int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var podeVerEntregas = (await authorizationService
            .AuthorizeAsync(User, Permissions.Suprimentos.Visualizar)).Succeeded;
        var podeVerCaixa = (await authorizationService
            .AuthorizeAsync(User, Permissions.Caixa.Visualizar)).Succeeded;

        var result = await historicoService.GetAsync(id, page, pageSize, podeVerEntregas, podeVerCaixa);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> Create([FromBody] FamiliaCreateDto dto)
    {
        dto.ParoquiaId = ParoquiaAtualId
            ?? throw new InvalidOperationException("Nenhuma paróquia selecionada.");
        var result = await _familiaService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    // TODO(isolamento-paroquia): não confere a paróquia da família e aceita dto.ParoquiaId do cliente, permitindo movê-la de paróquia. Ver CLAUDE.md, "Filtro por Paróquia".
    [HttpPut("{id:int}")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> Update(int id, [FromBody] FamiliaUpdateDto dto)
    {
        var result = await _familiaService.UpdateAsync(id, dto);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> Delete(int id)
    {
        await _familiaService.DeleteAsync(id);
        return NoContent();
    }

    [HttpPost("{id:int}/membros")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> AdicionarMembro(int id, [FromBody] PessoaCreateDto dto)
    {
        var result = await _familiaService.AdicionarMembroAsync(id, dto);
        return Ok(result);
    }

    [HttpPut("{id:int}/membros/{pessoaId:int}")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> AtualizarMembro(int id, int pessoaId, [FromBody] PessoaCreateDto dto)
    {
        var result = await _familiaService.AtualizarMembroAsync(id, pessoaId, dto);
        return Ok(result);
    }

    [HttpDelete("{id:int}/membros/{pessoaId:int}")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> RemoverMembro(int id, int pessoaId)
    {
        await _familiaService.RemoverMembroAsync(id, pessoaId);
        return NoContent();
    }

    [HttpPut("{id:int}/responsavel/{pessoaId:int}")]
    [Authorize(Policy = Permissions.Familia.CriarEditar)]
    public async Task<IActionResult> TrocarResponsavel(int id, int pessoaId)
    {
        var result = await _familiaService.TrocarResponsavelAsync(id, pessoaId);
        return Ok(result);
    }
}
