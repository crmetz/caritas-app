using System;
using System.Collections.Generic;
using System.Text;

namespace Caritas.Service.Services.Email.Templates
{
    //ATENÇÃO: Esse não é o jeito mais elegante de fazer. O ideal seria usar arquivos .hmtl e um motor de template ou RazorLight
    //Se quiserem algo mais flexível, considerem refatorar.
    internal static class EmailLayout
    {
        internal static string Wrap(string content) => $@"
        <!DOCTYPE html>
        <html lang='pt-BR'>
        <head>
            <meta charset='UTF-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <style>
                body {{
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f4;
                    font-family: Arial, sans-serif;
                }}
                .container {{
                    max-width: 600px;
                    margin: 40px auto;
                    background-color: #ffffff;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
                }}
                .header {{
                    background-color: #c0392b;
                    padding: 32px;
                    text-align: center;
                }}
                .header h1 {{
                    margin: 0;
                    color: #ffffff;
                    font-size: 24px;
                }}
                .body {{
                    padding: 32px;
                    color: #333333;
                    line-height: 1.6;
                }}
                .body p {{
                    margin: 0 0 16px;
                }}
                .footer {{
                    background-color: #f9f9f9;
                    border-top: 1px solid #e0e0e0;
                    padding: 16px 32px;
                    text-align: center;
                    font-size: 12px;
                    color: #999999;
                }}
                .highlight {{
                    color: #c0392b;
                    font-weight: bold;
                }}
            </style>
        </head>
        <body>
            <div class='container'>
                {content}
            </div>
        </body>
        </html>";
    }
}
