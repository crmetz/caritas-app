using Caritas.Models.DTOs.Common;
using Caritas.Models.DTOs.Endereço;
using System;
using System.Collections.Generic;
using System.Text;

namespace Caritas.Models.DTOs.Paroquia
{
    public class ParoquiaDto : EntityDto
    {
        public string? Nome { get; set; }
        public EnderecoDto? Endereco { get; set; }

        public DateTime CriadoEm { get; set; }
        public DateTime? AtualizadoEm { get; set; }
    }
}
