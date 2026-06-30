using Caritas.Models.DTOs.LoteCesta;
using Caritas.Models.DTOs.Montagem;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Repository.Context;
using Caritas.Service.Mappers;

namespace Caritas.Service;

public class MontagemCestaService(
    CaritasDbContext context,
    IConfiguracaoCestaRepository configRepo,
    IEstoqueRepository estoqueRepository,
    ILoteCestaRepository loteRepository,
    IMovimentacaoService movimentacaoService,
    ICurrentSession session) : IMontagemCestaService
{
    public async Task<MontagemPropostaDto> SimularAsync(MontagemSimularDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var config = await configRepo.GetByIdWithItensAsync(dto.IdConfiguracaoCesta)
            ?? throw new KeyNotFoundException($"Configuração de cesta {dto.IdConfiguracaoCesta} não encontrada.");

        var hoje = DateOnly.FromDateTime(DateTime.UtcNow);
        var proposta = new MontagemPropostaDto { IdConfiguracaoCesta = config.Id, Quantidade = dto.Quantidade };

        foreach (var item in config.Itens)
        {
            var necessario = item.QuantidadePacotes * dto.Quantidade;
            var lotes = await estoqueRepository.GetLotesDisponiveisAsync(item.IdAlimento, item.Tamanho, idParoquia);

            var linha = new PropostaLinhaDto
            {
                IdAlimento = item.IdAlimento,
                NomeAlimento = item.Alimento.Descricao,
                Tamanho = item.Tamanho,
                TamanhoFormatado = MedidaHelper.Formatar(item.Tamanho, item.Alimento.FormaMedida),
                PacotesNecessarios = necessario,
            };

            // Expõe TODOS os lotes disponíveis; sugere FIFO só nos não vencidos (validade mais
            // próxima primeiro). Vencidos aparecem com sugestão 0 (alerta), mas podem ser usados.
            var restante = necessario;
            foreach (var lote in lotes)
            {
                var vencido = lote.Validade.HasValue && lote.Validade.Value < hoje;
                var sugerida = 0;
                if (!vencido && restante > 0)
                {
                    sugerida = Math.Min(restante, lote.Quantidade);
                    restante -= sugerida;
                }
                linha.LotesDisponiveis.Add(new LoteDisponivelDto
                {
                    Validade = lote.Validade, Lote = lote.Lote, Saldo = lote.Quantidade,
                    Vencido = vencido, QtdSugerida = sugerida,
                });
            }

            linha.PacotesFaltantes = Math.Max(0, restante);
            proposta.Linhas.Add(linha);
        }

        return proposta;
    }

    public async Task<LoteCestaResponseDto> ConfirmarAsync(MontagemConfirmarDto dto)
    {
        var idParoquia = session.ParoquiaAtualId
            ?? throw new InvalidOperationException("Paróquia atual não definida (header X-Paroquia-Id).");
        var config = await configRepo.GetByIdWithItensAsync(dto.IdConfiguracaoCesta)
            ?? throw new KeyNotFoundException($"Configuração de cesta {dto.IdConfiguracaoCesta} não encontrada.");
        if (dto.Alocacoes.Count == 0)
            throw new ArgumentException("A montagem precisa de ao menos uma alocação.");

        await using var tx = await context.Database.BeginTransactionAsync();

        var lote = new LoteCesta
        {
            IdParoquia = idParoquia,
            Origem = OrigemCesta.Montagem,
            IdConfiguracaoCesta = config.Id,
            Quantidade = dto.Quantidade,
            QuantidadeDisponivel = dto.Quantidade,
            Observacao = dto.Observacao,
        };
        loteRepository.Add(lote);
        await context.SaveChangesAsync();   // gera lote.Id

        foreach (var a in dto.Alocacoes)
        {
            if (a.QtdPacotes <= 0) continue;
            await movimentacaoService.AplicarMovimentoAsync(new MovimentacaoEstoque
            {
                IdItem = a.IdAlimento, IdParoquia = idParoquia, Tamanho = a.Tamanho,
                Validade = a.Validade, Lote = a.Lote,
                TipoOperacao = TipoOperacao.Saida, Quantidade = a.QtdPacotes,
                OrigemTipo = OrigemMovimentacao.MontagemCesta, OrigemId = lote.Id,
            });
        }

        await context.SaveChangesAsync();
        await tx.CommitAsync();

        lote.ConfiguracaoCesta = config;   // p/ preencher NomeConfiguracao na resposta
        return lote.ToResponseDto();
    }
}
