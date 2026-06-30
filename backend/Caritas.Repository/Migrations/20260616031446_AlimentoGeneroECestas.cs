using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AlimentoGeneroECestas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CestaBasica");

            migrationBuilder.DropIndex(
                name: "IX_Estoque_IdItem_IdParoquia_Validade_Lote",
                table: "Estoque");

            migrationBuilder.AddColumn<int>(
                name: "Tamanho",
                table: "MovimentacaoEstoque",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Tamanho",
                table: "Estoque",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormaMedida",
                table: "Alimento",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Peso");

            migrationBuilder.CreateTable(
                name: "ConfiguracaoCesta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracaoCesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConfiguracaoCesta_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItemConfiguracaoCesta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdConfiguracaoCesta = table.Column<int>(type: "integer", nullable: false),
                    IdAlimento = table.Column<int>(type: "integer", nullable: false),
                    Tamanho = table.Column<int>(type: "integer", nullable: false),
                    QuantidadePacotes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItemConfiguracaoCesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItemConfiguracaoCesta_Alimento_IdAlimento",
                        column: x => x.IdAlimento,
                        principalTable: "Alimento",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItemConfiguracaoCesta_ConfiguracaoCesta_IdConfiguracaoCesta",
                        column: x => x.IdConfiguracaoCesta,
                        principalTable: "ConfiguracaoCesta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "LoteCesta",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    Origem = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IdConfiguracaoCesta = table.Column<int>(type: "integer", nullable: true),
                    IdDoador = table.Column<int>(type: "integer", nullable: true),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    QuantidadeDisponivel = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoteCesta", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LoteCesta_ConfiguracaoCesta_IdConfiguracaoCesta",
                        column: x => x.IdConfiguracaoCesta,
                        principalTable: "ConfiguracaoCesta",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LoteCesta_Doador_IdDoador",
                        column: x => x.IdDoador,
                        principalTable: "Doador",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LoteCesta_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Estoque_IdItem_IdParoquia_Tamanho_Validade_Lote",
                table: "Estoque",
                columns: new[] { "IdItem", "IdParoquia", "Tamanho", "Validade", "Lote" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracaoCesta_IdParoquia",
                table: "ConfiguracaoCesta",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_ItemConfiguracaoCesta_IdAlimento",
                table: "ItemConfiguracaoCesta",
                column: "IdAlimento");

            migrationBuilder.CreateIndex(
                name: "IX_ItemConfiguracaoCesta_IdConfiguracaoCesta",
                table: "ItemConfiguracaoCesta",
                column: "IdConfiguracaoCesta");

            migrationBuilder.CreateIndex(
                name: "IX_LoteCesta_IdConfiguracaoCesta",
                table: "LoteCesta",
                column: "IdConfiguracaoCesta");

            migrationBuilder.CreateIndex(
                name: "IX_LoteCesta_IdDoador",
                table: "LoteCesta",
                column: "IdDoador");

            migrationBuilder.CreateIndex(
                name: "IX_LoteCesta_IdParoquia",
                table: "LoteCesta",
                column: "IdParoquia");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItemConfiguracaoCesta");

            migrationBuilder.DropTable(
                name: "LoteCesta");

            migrationBuilder.DropTable(
                name: "ConfiguracaoCesta");

            migrationBuilder.DropIndex(
                name: "IX_Estoque_IdItem_IdParoquia_Tamanho_Validade_Lote",
                table: "Estoque");

            migrationBuilder.DropColumn(
                name: "Tamanho",
                table: "MovimentacaoEstoque");

            migrationBuilder.DropColumn(
                name: "Tamanho",
                table: "Estoque");

            migrationBuilder.DropColumn(
                name: "FormaMedida",
                table: "Alimento");

            migrationBuilder.CreateTable(
                name: "CestaBasica",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    IdBeneficiario = table.Column<int>(type: "integer", nullable: true),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CestaBasica", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CestaBasica_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Estoque_IdItem_IdParoquia_Validade_Lote",
                table: "Estoque",
                columns: new[] { "IdItem", "IdParoquia", "Validade", "Lote" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.CreateIndex(
                name: "IX_CestaBasica_IdParoquia",
                table: "CestaBasica",
                column: "IdParoquia");
        }
    }
}
