using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarParoquiaFamiliaEIdentificacaoPessoa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NomeMae",
                table: "Pessoas",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TipoDocumentoAlternativo",
                table: "Pessoas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ParoquiaId",
                table: "Familias",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Familias_ParoquiaId",
                table: "Familias",
                column: "ParoquiaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Familias_Paroquia_ParoquiaId",
                table: "Familias",
                column: "ParoquiaId",
                principalTable: "Paroquia",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Familias_Paroquia_ParoquiaId",
                table: "Familias");

            migrationBuilder.DropIndex(
                name: "IX_Familias_ParoquiaId",
                table: "Familias");

            migrationBuilder.DropColumn(
                name: "NomeMae",
                table: "Pessoas");

            migrationBuilder.DropColumn(
                name: "TipoDocumentoAlternativo",
                table: "Pessoas");

            migrationBuilder.DropColumn(
                name: "ParoquiaId",
                table: "Familias");
        }
    }
}
