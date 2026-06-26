using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class RenomearOrigemCestaBasicaParaMontagemCesta : Migration
    {
        // OrigemMovimentacao é persistido como string (HasConversion<string>). O valor "CestaBasica"
        // foi renomeado para "MontagemCesta"; não há mudança de schema, só dos dados já gravados.
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"UPDATE ""MovimentacaoEstoque"" SET ""OrigemTipo"" = 'MontagemCesta' WHERE ""OrigemTipo"" = 'CestaBasica';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"UPDATE ""MovimentacaoEstoque"" SET ""OrigemTipo"" = 'CestaBasica' WHERE ""OrigemTipo"" = 'MontagemCesta';");
        }
    }
}
