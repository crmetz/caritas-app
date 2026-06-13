using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarAtendimento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Atendimentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FamiliaId = table.Column<int>(type: "integer", nullable: false),
                    ParoquiaId = table.Column<int>(type: "integer", nullable: false),
                    VoluntarioId = table.Column<int>(type: "integer", nullable: false),
                    DataAtendimento = table.Column<DateOnly>(type: "date", nullable: false),
                    Relato = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    RendaFamiliarMomento = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    QtdMembrosTrabalhando = table.Column<int>(type: "integer", nullable: true),
                    NecessidadesIdentificadas = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    EncaminhamentosRealizados = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SituacaoGeral = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Atendimentos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Atendimentos_AspNetUsers_VoluntarioId",
                        column: x => x.VoluntarioId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Atendimentos_Familias_FamiliaId",
                        column: x => x.FamiliaId,
                        principalTable: "Familias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Atendimentos_Paroquia_ParoquiaId",
                        column: x => x.ParoquiaId,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Atendimentos_FamiliaId",
                table: "Atendimentos",
                column: "FamiliaId");

            migrationBuilder.CreateIndex(
                name: "IX_Atendimentos_ParoquiaId",
                table: "Atendimentos",
                column: "ParoquiaId");

            migrationBuilder.CreateIndex(
                name: "IX_Atendimentos_VoluntarioId",
                table: "Atendimentos",
                column: "VoluntarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Atendimentos");
        }
    }
}
