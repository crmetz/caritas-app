using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class DoacaoUnificadaEntregaFamilia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoteCesta_Doador_IdDoador",
                table: "LoteCesta");

            migrationBuilder.RenameColumn(
                name: "IdDoador",
                table: "LoteCesta",
                newName: "IdDoacao");

            migrationBuilder.RenameIndex(
                name: "IX_LoteCesta_IdDoador",
                table: "LoteCesta",
                newName: "IX_LoteCesta_IdDoacao");

            migrationBuilder.AddColumn<int>(
                name: "IdEntrega",
                table: "MovimentacaoCesta",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Doacao",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Itens");

            // Motivo de baixa renomeado: Doada -> Transferida (caso existam linhas legadas).
            migrationBuilder.Sql("UPDATE \"MovimentacaoCesta\" SET \"Motivo\" = 'Transferida' WHERE \"Motivo\" = 'Doada';");

            // IdDoador (Doador.Id) foi renomeado para IdDoacao, mas semanticamente agora aponta para Doacao.
            // Sem backfill (massa dev quase vazia): zera qualquer valor herdado que não seja uma Doacao válida,
            // evitando violação da nova FK.
            migrationBuilder.Sql("UPDATE \"LoteCesta\" SET \"IdDoacao\" = NULL WHERE \"IdDoacao\" IS NOT NULL AND \"IdDoacao\" NOT IN (SELECT \"Id\" FROM \"Doacao\");");

            migrationBuilder.CreateTable(
                name: "Entrega",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    IdFamilia = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Entrega", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Entrega_Familias_IdFamilia",
                        column: x => x.IdFamilia,
                        principalTable: "Familias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Entrega_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoCesta_IdEntrega",
                table: "MovimentacaoCesta",
                column: "IdEntrega");

            migrationBuilder.CreateIndex(
                name: "IX_Entrega_IdFamilia",
                table: "Entrega",
                column: "IdFamilia");

            migrationBuilder.CreateIndex(
                name: "IX_Entrega_IdParoquia",
                table: "Entrega",
                column: "IdParoquia");

            migrationBuilder.AddForeignKey(
                name: "FK_LoteCesta_Doacao_IdDoacao",
                table: "LoteCesta",
                column: "IdDoacao",
                principalTable: "Doacao",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_MovimentacaoCesta_Entrega_IdEntrega",
                table: "MovimentacaoCesta",
                column: "IdEntrega",
                principalTable: "Entrega",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LoteCesta_Doacao_IdDoacao",
                table: "LoteCesta");

            migrationBuilder.DropForeignKey(
                name: "FK_MovimentacaoCesta_Entrega_IdEntrega",
                table: "MovimentacaoCesta");

            migrationBuilder.DropTable(
                name: "Entrega");

            migrationBuilder.DropIndex(
                name: "IX_MovimentacaoCesta_IdEntrega",
                table: "MovimentacaoCesta");

            migrationBuilder.DropColumn(
                name: "IdEntrega",
                table: "MovimentacaoCesta");

            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Doacao");

            migrationBuilder.RenameColumn(
                name: "IdDoacao",
                table: "LoteCesta",
                newName: "IdDoador");

            migrationBuilder.RenameIndex(
                name: "IX_LoteCesta_IdDoacao",
                table: "LoteCesta",
                newName: "IX_LoteCesta_IdDoador");

            migrationBuilder.AddForeignKey(
                name: "FK_LoteCesta_Doador_IdDoador",
                table: "LoteCesta",
                column: "IdDoador",
                principalTable: "Doador",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
