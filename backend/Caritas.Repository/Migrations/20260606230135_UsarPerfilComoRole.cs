using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class UsarPerfilComoRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Perfil_PerfilId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_PerfilPermissao_Perfil_PerfilId",
                table: "PerfilPermissao");

            migrationBuilder.DropTable(
                name: "Perfil");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_PerfilId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "PerfilId",
                table: "AspNetUsers");

            migrationBuilder.AddColumn<string>(
                name: "Descricao",
                table: "AspNetRoles",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "Estatico",
                table: "AspNetRoles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PerfilPaiId",
                table: "AspNetRoles",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_Name",
                table: "AspNetRoles",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoles_PerfilPaiId",
                table: "AspNetRoles",
                column: "PerfilPaiId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetRoles_AspNetRoles_PerfilPaiId",
                table: "AspNetRoles",
                column: "PerfilPaiId",
                principalTable: "AspNetRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PerfilPermissao_AspNetRoles_PerfilId",
                table: "PerfilPermissao",
                column: "PerfilId",
                principalTable: "AspNetRoles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetRoles_AspNetRoles_PerfilPaiId",
                table: "AspNetRoles");

            migrationBuilder.DropForeignKey(
                name: "FK_PerfilPermissao_AspNetRoles_PerfilId",
                table: "PerfilPermissao");

            migrationBuilder.DropIndex(
                name: "IX_AspNetRoles_Name",
                table: "AspNetRoles");

            migrationBuilder.DropIndex(
                name: "IX_AspNetRoles_PerfilPaiId",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "Descricao",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "Estatico",
                table: "AspNetRoles");

            migrationBuilder.DropColumn(
                name: "PerfilPaiId",
                table: "AspNetRoles");

            migrationBuilder.AddColumn<int>(
                name: "PerfilId",
                table: "AspNetUsers",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Perfil",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PerfilPaiId = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    Nome = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Perfil", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Perfil_Perfil_PerfilPaiId",
                        column: x => x.PerfilPaiId,
                        principalTable: "Perfil",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_PerfilId",
                table: "AspNetUsers",
                column: "PerfilId");

            migrationBuilder.CreateIndex(
                name: "IX_Perfil_Nome",
                table: "Perfil",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Perfil_PerfilPaiId",
                table: "Perfil",
                column: "PerfilPaiId");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Perfil_PerfilId",
                table: "AspNetUsers",
                column: "PerfilId",
                principalTable: "Perfil",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_PerfilPermissao_Perfil_PerfilId",
                table: "PerfilPermissao",
                column: "PerfilId",
                principalTable: "Perfil",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
