using Caritas.Models.DTOs.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace Caritas.Models.DTOs.Usuario
{
    public class UsuarioResponseDto : EntityDto
    {
        public string Nome { get; set; }
        public string Sobrenome { get; set; }
        public string Email { get; set; }
        public string? Telefone { get; set; }
        public bool Ativo { get; set; }
        public bool UsuarioAdmin { get; set; }
        public DateTime CriadoEm { get; set; }

    }
}
