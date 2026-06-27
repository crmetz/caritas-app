using Caritas.Models.DTOs.Movimentacao;
using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Service;

public class MovimentacaoService(
    CaritasDbContext context,
    IMovimentacaoRepository movimentacaoRepository,
    IEstoqueRepository estoqueRepository,
    ICurrentSession session) : IMovimentacaoService
{
    public async Task<MovimentacaoResponseDto> RegistrarAsync(MovimentacaoCreateDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        await using var tx = await context.Database.BeginTransactionAsync();

        var mov = new MovimentacaoEstoque
        {
            IdItem = dto.IdItem, IdParoquia = idParoquia,
            Tamanho = await ResolverTamanhoAsync(dto.IdItem, dto.TamanhoValor, dto.TamanhoUnidade),
            Validade = dto.Validade, Lote = dto.Lote,
            TipoOperacao = dto.TipoOperacao, Quantidade = dto.Quantidade,
            OrigemTipo = dto.OrigemTipo, OrigemId = dto.OrigemId, Observacao = dto.Observacao,
        };

        await AplicarMovimentoAsync(mov);
        await context.SaveChangesAsync();
        await tx.CommitAsync();
        return mov.ToResponseDto();
    }

    // Insere o movimento e aplica o delta ao saldo (lock pessimista). NÃO commita — o caller controla a transação.
    public async Task AplicarMovimentoAsync(MovimentacaoEstoque mov)
    {
        if (mov.Quantidade <= 0)
            throw new ArgumentException("Quantidade deve ser positiva.");

        movimentacaoRepository.Add(mov);

        var estoque = await estoqueRepository.GetByCoordsForUpdateAsync(mov.IdItem, mov.IdParoquia, mov.Tamanho, mov.Validade, mov.Lote);
        if (estoque is null)
        {
            estoque = new Estoque
            {
                IdItem = mov.IdItem, IdParoquia = mov.IdParoquia, Tamanho = mov.Tamanho,
                Validade = mov.Validade, Lote = mov.Lote, Quantidade = 0,
            };
            estoqueRepository.Add(estoque);
        }

        estoque.Quantidade += mov.TipoOperacao == TipoOperacao.Entrada ? mov.Quantidade : -mov.Quantidade;
        if (estoque.Quantidade < 0)
            throw new InvalidOperationException("Saldo insuficiente para a saída.");
    }

    public async Task<int?> ResolverTamanhoAsync(int idItem, decimal? valor, string? unidade)
    {
        if (valor is null) return null;
        var forma = await context.Alimentos
            .Where(a => a.Id == idItem)
            .Select(a => (FormaMedida?)a.FormaMedida)
            .FirstOrDefaultAsync()
            ?? throw new ArgumentException($"Tamanho informado, mas o item {idItem} não é um alimento.");
        return MedidaHelper.ParaBase(valor.Value, unidade ?? string.Empty, forma);
    }

    public async Task<PagedResponseDto<MovimentacaoHistoricoDto>> GetHistoricoAsync(
        int page, int pageSize, int? idItem, OrigemMovimentacao? origemTipo, TipoItem? tipoItem)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");

        var paged = await movimentacaoRepository.GetHistoricoAsync(page, pageSize, idItem, idParoquia, origemTipo, tipoItem);

        var ids = paged.Items.Select(m => m.IdItem).Distinct().ToList();
        var itens = await context.Items.Where(i => ids.Contains(i.Id)).ToDictionaryAsync(i => i.Id);

        return new()
        {
            Items = paged.Items.Select(m => m.ToHistoricoDto(itens.GetValueOrDefault(m.IdItem))),
            TotalCount = paged.TotalCount,
        };
    }
}
