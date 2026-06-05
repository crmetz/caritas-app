namespace Caritas.Service.Services.Email.Templates
{
    //ATENÇÃO: Esse não é o jeito mais elegante de fazer. O ideal seria usar arquivos .hmtl e um motor de template ou RazorLight
    //Se quiserem algo mais flexível, considerem refatorar.
    public static class PasswordRecoverEmail
    {
        public static string Build(string token) => EmailLayout.Wrap($@"
        <div class='header'>
            <h1>Cáritas</h1>
        </div>
        <div class='body'>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Para criar uma nova senha, acesse o link:</p>
            <a href='url?token={Uri.EscapeDataString(token)}'>Redefinir senha<a>
            <p>Por motivos de segurança, este link expirará em 24 horas.</p>
            <p>Se você não solicitou a redefinição de senha, pode ignorar este e-mail. Sua conta permanecerá segura e nenhuma alteração será realizada.</p>
        </div>
        <div class='footer'>
            &copy; {DateTime.Now.Year} Cáritas. Todos os direitos reservados.
        </div>");

        public const string Subject = "Recuperação de senha";
    }
}
