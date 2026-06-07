namespace Caritas.Service.Services.Email.Templates
{
    internal static class FirstAccessEmail
    {
        public static string Build(string userName, string link) => EmailLayout.Wrap($@"
        <div class='header'>
            <h1>Cáritas</h1>
        </div>
        <div class='body'>
            <p>Olá, <span class='highlight'>{userName}</span>!</p>
            <p>Sua conta foi criada no sistema Cáritas.</p>
            <p>Para definir sua senha e ativar o acesso, clique no botão abaixo:</p>
            <p style='text-align: center; margin: 24px 0;'>
                <a href='{link}' style='background-color: #c0392b; color: #ffffff; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;'>Configurar minha senha</a>
            </p>
            <p>Por motivos de segurança, este link expirará em 24 horas.</p>
            <p>Se você não esperava receber este e-mail, entre em contato com o administrador.</p>
        </div>
        <div class='footer'>
            &copy; {DateTime.Now.Year} Cáritas. Todos os direitos reservados.
        </div>");

        public const string Subject = "Bem-vindo ao Cáritas — Configure sua senha";
    }
}
