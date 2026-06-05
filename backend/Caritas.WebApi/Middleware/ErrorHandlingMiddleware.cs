using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Middleware;

public class ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", context.Request.Method, context.Request.Path);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception ex)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = ex switch
        {
            KeyNotFoundException  => StatusCodes.Status404NotFound,
            ArgumentException     => StatusCodes.Status400BadRequest,
            InvalidOperationException => StatusCodes.Status422UnprocessableEntity,
            UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
            _                     => StatusCodes.Status500InternalServerError,
        };

        var problem = new ProblemDetails
        {
            Status = context.Response.StatusCode,
            Title = ex switch
            {
                KeyNotFoundException      => "Recurso não encontrado",
                ArgumentException         => "Dados inválidos",
                InvalidOperationException => "Operação inválida",
                UnauthorizedAccessException => "Acesso não autorizado",
                _                         => "Erro interno do servidor",
            },
            Detail = ex.Message,
        };

        return context.Response.WriteAsJsonAsync(problem);
    }
}
