using MailKit.Net.Smtp;
using MimeKit;

namespace Caritas.Service.Services;

public class EmailService
{

    // TODO: Mover configurações SMTP para appsettings.json via IConfiguration, ou algum outro método
    public async Task SendFirstAccessEmailAsync(
        string email,
        string nome,
        string senha)
    {
        var message = new MimeMessage();

        message.From.Add(
            new MailboxAddress("Caritas", "EMAIL_DO_SISTEMA"));

        message.To.Add(
            new MailboxAddress(nome, email));

        message.Subject = "Bem vindo ao Caritas!";

        message.Body = new TextPart("plain")
        {
            Text = $"Utilize a seguinte senha para seu primeiro acesso: {senha}\nAo fazer login, você será redirecionado para definir sua senha."
        };

        using var client = new SmtpClient();

        await client.ConnectAsync(
            "smtp.gmail.com",
            587,
            MailKit.Security.SecureSocketOptions.StartTls);

        await client.AuthenticateAsync(
            "EMAIL_DO_SISTEMA",
            "EMAIL_PASSWORD");

        await client.SendAsync(message);

        await client.DisconnectAsync(true);
    }
}