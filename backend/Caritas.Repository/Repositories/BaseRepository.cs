using Caritas.Models.DTOs.Pagination;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Context;
using Caritas.Repository.Extensions;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Repositories;

public class BaseRepository<T>(CaritasDbContext context) : IBaseRepository<T> where T : BaseEntity
{
    protected readonly CaritasDbContext Context = context;
    protected readonly DbSet<T> DbSet = context.Set<T>();

    public async Task<T?> GetByIdAsync(int id)
        => await DbSet.FirstOrDefaultAsync(e => e.Id == id);

    public async Task<PagedResponseDto<T>> GetPagedAsync(int page, int pageSize)
        => await DbSet.OrderBy(e => e.CreatedAt).ToPagedAsync(page, pageSize);

    public async Task<T> AddAsync(T entity)
    {
        await DbSet.AddAsync(entity);
        await Context.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        DbSet.Update(entity);
        await Context.SaveChangesAsync();
    }

    public async Task DeleteAsync(int id)
    {
        var entity = await GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Registro com id {id} não encontrado.");
        DbSet.Remove(entity);
        await Context.SaveChangesAsync();
    }
}
