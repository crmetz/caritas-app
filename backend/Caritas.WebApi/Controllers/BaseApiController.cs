using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace Caritas.WebApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    // PEGAR CLAIMS JWT...
}
