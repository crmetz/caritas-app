namespace Caritas.Service.Services.Email.Templates
{
    //ATENÇÃO: Esse não é o jeito mais elegante de fazer. O ideal seria usar arquivos .hmtl e um motor de template ou RazorLight
    //Se quiserem algo mais flexível, considerem refatorar.
    internal static class AccountCreatedEmail
    {
        public static string Build(string userName) => EmailLayout.Wrap($@"
        <div class='header'>
            <h1>Cáritas</h1>
        </div>
        <div class='body'>
            <p>Olá, <span class='highlight'>{userName}</span>!</p>
            <p>Sua conta foi criada com sucesso. Você já faz parte do sistema Cáritas.</p>
            <p>Se você não solicitou essa conta, entre em contato com nosso suporte.</p>
        </div>
        <div class='footer'>
            &copy; {DateTime.Now.Year} Cáritas. Todos os direitos reservados.
        </div>");

        public const string Subject = "Sua conta foi criada";
    }
}
