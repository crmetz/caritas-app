using System;
using System.Collections.Generic;
using System.Text;

namespace Caritas.Models.Common
{
    public class AuditableEntity : Entity
    {
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;
    }
}
