using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class RemoverParoquiaDeEndereco : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Paroquia_EnderecoId",
                table: "Paroquia");

            migrationBuilder.CreateIndex(
                name: "IX_Paroquia_EnderecoId",
                table: "Paroquia",
                column: "EnderecoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Paroquia_EnderecoId",
                table: "Paroquia");

            migrationBuilder.CreateIndex(
                name: "IX_Paroquia_EnderecoId",
                table: "Paroquia",
                column: "EnderecoId",
                unique: true);
        }
    }
}
