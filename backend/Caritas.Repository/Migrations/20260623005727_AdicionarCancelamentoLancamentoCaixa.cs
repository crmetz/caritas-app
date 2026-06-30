using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCancelamentoLancamentoCaixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Cancelado",
                table: "LancamentosCaixa",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CanceladoEm",
                table: "LancamentosCaixa",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoCancelamento",
                table: "LancamentosCaixa",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cancelado",
                table: "LancamentosCaixa");

            migrationBuilder.DropColumn(
                name: "CanceladoEm",
                table: "LancamentosCaixa");

            migrationBuilder.DropColumn(
                name: "MotivoCancelamento",
                table: "LancamentosCaixa");
        }
    }
}
