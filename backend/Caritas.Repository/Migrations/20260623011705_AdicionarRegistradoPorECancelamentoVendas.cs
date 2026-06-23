using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarRegistradoPorECancelamentoVendas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Cancelado",
                table: "VendasBrecho",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CanceladoEm",
                table: "VendasBrecho",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CanceladoPor",
                table: "VendasBrecho",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoCancelamento",
                table: "VendasBrecho",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistradoPor",
                table: "VendasBrecho",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RegistradoPor",
                table: "VendasBazar",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cancelado",
                table: "VendasBrecho");

            migrationBuilder.DropColumn(
                name: "CanceladoEm",
                table: "VendasBrecho");

            migrationBuilder.DropColumn(
                name: "CanceladoPor",
                table: "VendasBrecho");

            migrationBuilder.DropColumn(
                name: "MotivoCancelamento",
                table: "VendasBrecho");

            migrationBuilder.DropColumn(
                name: "RegistradoPor",
                table: "VendasBrecho");

            migrationBuilder.DropColumn(
                name: "RegistradoPor",
                table: "VendasBazar");
        }
    }
}
