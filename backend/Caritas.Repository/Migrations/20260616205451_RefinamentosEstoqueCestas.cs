using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class RefinamentosEstoqueCestas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "FaixaEtaria",
                table: "Roupa",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            // Faixas removidas do domínio: limpa valores legados que não mapeiam mais para o enum.
            migrationBuilder.Sql(
                "UPDATE \"Roupa\" SET \"FaixaEtaria\" = NULL WHERE \"FaixaEtaria\" IN ('Adolescente', 'Idoso');");

            migrationBuilder.CreateTable(
                name: "MovimentacaoCesta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdLoteCesta = table.Column<int>(type: "integer", nullable: false),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    Motivo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimentacaoCesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimentacaoCesta_LoteCesta_IdLoteCesta",
                        column: x => x.IdLoteCesta,
                        principalTable: "LoteCesta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimentacaoCesta_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoCesta_IdLoteCesta",
                table: "MovimentacaoCesta",
                column: "IdLoteCesta");

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoCesta_IdParoquia",
                table: "MovimentacaoCesta",
                column: "IdParoquia");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovimentacaoCesta");

            migrationBuilder.AlterColumn<string>(
                name: "FaixaEtaria",
                table: "Roupa",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);
        }
    }
}
