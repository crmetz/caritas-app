using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;

namespace Caritas.Repository.Repositories;

public class DoadorRepository(CaritasDbContext context) : BaseRepository<Doador>(context), IDoadorRepository { }
