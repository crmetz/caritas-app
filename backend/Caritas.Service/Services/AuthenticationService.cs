using Caritas.Models.DTOs.Authentication;

namespace Caritas.Service.Services
{
    public class AuthenticationService
    {

        public AuthenticationService() { }


        public Task LoginAsync(LoginDto dto)
        {
            return Task.CompletedTask;
        }

    }
}
