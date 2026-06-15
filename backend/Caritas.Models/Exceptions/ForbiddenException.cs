namespace Caritas.Models.Exceptions;

//Quando o user está autenticado, mas não tem permissão para acessar um recurso específico
public class ForbiddenException(string message) : Exception(message);
