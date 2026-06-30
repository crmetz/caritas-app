using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;

namespace Caritas.Repository.Repositories;

public class MovimentacaoCestaRepository(CaritasDbContext context)
    : BaseRepository<MovimentacaoCesta>(context), IMovimentacaoCestaRepository
{
    public void Add(MovimentacaoCesta movimentacao) => Context.MovimentacoesCesta.Add(movimentacao);
}
