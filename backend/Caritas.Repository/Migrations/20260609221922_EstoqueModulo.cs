using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class EstoqueModulo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CestaBasica",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    IdBeneficiario = table.Column<int>(type: "integer", nullable: true),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
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

            migrationBuilder.CreateTable(
                name: "Doador",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Documento = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Telefone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Doador", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Item",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Item", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Doacao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdDoador = table.Column<int>(type: "integer", nullable: false),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Doacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Doacao_Doador_IdDoador",
                        column: x => x.IdDoador,
                        principalTable: "Doador",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Doacao_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Alimento",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alimento", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Alimento_Item_Id",
                        column: x => x.Id,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Estoque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdItem = table.Column<int>(type: "integer", nullable: false),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    Validade = table.Column<DateOnly>(type: "date", nullable: true),
                    Lote = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Quantidade = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Estoque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Estoque_Item_IdItem",
                        column: x => x.IdItem,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Estoque_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "MovimentacaoEstoque",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdItem = table.Column<int>(type: "integer", nullable: false),
                    IdParoquia = table.Column<int>(type: "integer", nullable: false),
                    Validade = table.Column<DateOnly>(type: "date", nullable: true),
                    Lote = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    TipoOperacao = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    OrigemTipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    OrigemId = table.Column<int>(type: "integer", nullable: true),
                    Observacao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoPor = table.Column<int>(type: "integer", nullable: true),
                    AtualizadoPor = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovimentacaoEstoque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MovimentacaoEstoque_Item_IdItem",
                        column: x => x.IdItem,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_MovimentacaoEstoque_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Roupa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Categoria = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Genero = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FaixaEtaria = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Tamanho = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Estacao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Condicao = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roupa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Roupa_Item_Id",
                        column: x => x.Id,
                        principalTable: "Item",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CestaBasica_IdParoquia",
                table: "CestaBasica",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_Doacao_IdDoador",
                table: "Doacao",
                column: "IdDoador");

            migrationBuilder.CreateIndex(
                name: "IX_Doacao_IdParoquia",
                table: "Doacao",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_Estoque_IdItem_IdParoquia_Validade_Lote",
                table: "Estoque",
                columns: new[] { "IdItem", "IdParoquia", "Validade", "Lote" },
                unique: true)
                .Annotation("Npgsql:NullsDistinct", false);

            migrationBuilder.CreateIndex(
                name: "IX_Estoque_IdParoquia",
                table: "Estoque",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoEstoque_IdItem_IdParoquia",
                table: "MovimentacaoEstoque",
                columns: new[] { "IdItem", "IdParoquia" });

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoEstoque_IdParoquia",
                table: "MovimentacaoEstoque",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_MovimentacaoEstoque_OrigemTipo_OrigemId",
                table: "MovimentacaoEstoque",
                columns: new[] { "OrigemTipo", "OrigemId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alimento");

            migrationBuilder.DropTable(
                name: "CestaBasica");

            migrationBuilder.DropTable(
                name: "Doacao");

            migrationBuilder.DropTable(
                name: "Estoque");

            migrationBuilder.DropTable(
                name: "MovimentacaoEstoque");

            migrationBuilder.DropTable(
                name: "Roupa");

            migrationBuilder.DropTable(
                name: "Doador");

            migrationBuilder.DropTable(
                name: "Item");
        }
    }
}
