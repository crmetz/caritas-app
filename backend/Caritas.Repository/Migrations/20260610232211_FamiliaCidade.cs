using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class FamiliaCidade : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FamiliaCidades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FamiliaCidades", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FamiliaCidades_Nome",
                table: "FamiliaCidades",
                column: "Nome",
                unique: true);

            // Semeia a cidade padrão (todas as famílias são de Caxias do Sul).
            migrationBuilder.Sql(
                "INSERT INTO \"FamiliaCidades\" (\"Nome\", \"CriadoEm\", \"AtualizadoEm\") VALUES ('Caxias do Sul', NOW(), NOW());");

            // Coluna temporariamente anulável para permitir o backfill das famílias existentes.
            migrationBuilder.AddColumn<int>(
                name: "CidadeId",
                table: "Familias",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE \"Familias\" SET \"CidadeId\" = (SELECT \"Id\" FROM \"FamiliaCidades\" WHERE \"Nome\" = 'Caxias do Sul' LIMIT 1);");

            migrationBuilder.AlterColumn<int>(
                name: "CidadeId",
                table: "Familias",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "Cidade",
                table: "Familias");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "Familias");

            migrationBuilder.CreateIndex(
                name: "IX_Familias_CidadeId",
                table: "Familias",
                column: "CidadeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Familias_FamiliaCidades_CidadeId",
                table: "Familias",
                column: "CidadeId",
                principalTable: "FamiliaCidades",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Familias_FamiliaCidades_CidadeId",
                table: "Familias");

            migrationBuilder.DropTable(
                name: "FamiliaCidades");

            migrationBuilder.DropIndex(
                name: "IX_Familias_CidadeId",
                table: "Familias");

            migrationBuilder.DropColumn(
                name: "CidadeId",
                table: "Familias");

            migrationBuilder.AddColumn<string>(
                name: "Cidade",
                table: "Familias",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "Familias",
                type: "character varying(2)",
                maxLength: 2,
                nullable: false,
                defaultValue: "");
        }
    }
}
