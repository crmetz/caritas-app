using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AddCancelamentoVendaBazar : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Cancelado",
                table: "VendasBazar",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CanceladoEm",
                table: "VendasBazar",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CanceladoPor",
                table: "VendasBazar",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MotivoCancelamento",
                table: "VendasBazar",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cancelado",
                table: "VendasBazar");

            migrationBuilder.DropColumn(
                name: "CanceladoEm",
                table: "VendasBazar");

            migrationBuilder.DropColumn(
                name: "CanceladoPor",
                table: "VendasBazar");

            migrationBuilder.DropColumn(
                name: "MotivoCancelamento",
                table: "VendasBazar");
        }
    }
}
