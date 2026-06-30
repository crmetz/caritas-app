using Caritas.Models.Entities;

namespace Caritas.Models.Interfaces;

public interface IMovimentacaoCestaRepository : IBaseRepository<MovimentacaoCesta>
{
    void Add(MovimentacaoCesta movimentacao);   // sem commit (uso transacional)
}
