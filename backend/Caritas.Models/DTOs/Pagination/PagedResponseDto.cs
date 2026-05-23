namespace Caritas.Models.DTOs.Pagination;

public class PagedResponseDto<T>
{
    public IEnumerable<T> Items { get; set; } = [];
    public int TotalCount { get; set; }
}
