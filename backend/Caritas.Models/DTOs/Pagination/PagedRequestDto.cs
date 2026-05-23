namespace Caritas.Models.DTOs.Pagination;

public class PagedRequestDto
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
