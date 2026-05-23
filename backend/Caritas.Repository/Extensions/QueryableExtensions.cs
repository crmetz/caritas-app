using Caritas.Models.DTOs.Pagination;
using Microsoft.EntityFrameworkCore;

namespace Caritas.Repository.Extensions;

public static class QueryableExtensions
{
    public static async Task<PagedResponseDto<T>> ToPagedAsync<T>(
        this IQueryable<T> query,
        int page,
        int pageSize)
    {
        var total = await query.CountAsync();
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponseDto<T>
        {
            Items = items,
            TotalCount = total,
        };
    }
}
