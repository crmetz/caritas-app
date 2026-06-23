using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarModulosBazarBrechoCaixa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Remessas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Origem = table.Column<int>(type: "integer", nullable: false),
                    DataChegada = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Remessas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VendasBazar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompradorNome = table.Column<string>(type: "text", nullable: false),
                    CompradorCpf = table.Column<string>(type: "text", nullable: true),
                    CompradorIdentificacaoAlternativa = table.Column<string>(type: "text", nullable: true),
                    FormaPagamento = table.Column<int>(type: "integer", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    DataVenda = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendasBazar", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VendasBrecho",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParoquiaId = table.Column<int>(type: "integer", nullable: false),
                    CompradorNome = table.Column<string>(type: "text", nullable: false),
                    CompradorCpf = table.Column<string>(type: "text", nullable: true),
                    CompradorIdentificacaoAlternativa = table.Column<string>(type: "text", nullable: true),
                    FormaPagamento = table.Column<int>(type: "integer", nullable: false),
                    ValorTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    DataVenda = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VendasBrecho", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VendasBrecho_Paroquia_ParoquiaId",
                        column: x => x.ParoquiaId,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pecas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Categoria = table.Column<string>(type: "text", nullable: false),
                    Descricao = table.Column<string>(type: "text", nullable: true),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    Preco = table.Column<decimal>(type: "numeric", nullable: false),
                    RemessaId = table.Column<int>(type: "integer", nullable: true),
                    ParoquiaId = table.Column<int>(type: "integer", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pecas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Pecas_Paroquia_ParoquiaId",
                        column: x => x.ParoquiaId,
                        principalTable: "Paroquia",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Pecas_Remessas_RemessaId",
                        column: x => x.RemessaId,
                        principalTable: "Remessas",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "LancamentosCaixa",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ParoquiaId = table.Column<int>(type: "integer", nullable: false),
                    Data = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Tipo = table.Column<int>(type: "integer", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    Origem = table.Column<int>(type: "integer", nullable: true),
                    Destino = table.Column<int>(type: "integer", nullable: true),
                    FamiliaId = table.Column<int>(type: "integer", nullable: true),
                    VendaBrechoId = table.Column<int>(type: "integer", nullable: true),
                    Responsavel = table.Column<string>(type: "text", nullable: false),
                    GeradoAutomaticamente = table.Column<bool>(type: "boolean", nullable: false),
                    Observacoes = table.Column<string>(type: "text", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LancamentosCaixa", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LancamentosCaixa_Familias_FamiliaId",
                        column: x => x.FamiliaId,
                        principalTable: "Familias",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_LancamentosCaixa_Paroquia_ParoquiaId",
                        column: x => x.ParoquiaId,
                        principalTable: "Paroquia",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LancamentosCaixa_VendasBrecho_VendaBrechoId",
                        column: x => x.VendaBrechoId,
                        principalTable: "VendasBrecho",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItensVendaBazar",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VendaBazarId = table.Column<int>(type: "integer", nullable: false),
                    PecaId = table.Column<int>(type: "integer", nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    ValorUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensVendaBazar", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensVendaBazar_Pecas_PecaId",
                        column: x => x.PecaId,
                        principalTable: "Pecas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItensVendaBazar_VendasBazar_VendaBazarId",
                        column: x => x.VendaBazarId,
                        principalTable: "VendasBazar",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ItensVendaBrecho",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VendaBrechoId = table.Column<int>(type: "integer", nullable: false),
                    PecaId = table.Column<int>(type: "integer", nullable: false),
                    Quantidade = table.Column<int>(type: "integer", nullable: false),
                    ValorUnitario = table.Column<decimal>(type: "numeric", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AtualizadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItensVendaBrecho", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItensVendaBrecho_Pecas_PecaId",
                        column: x => x.PecaId,
                        principalTable: "Pecas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ItensVendaBrecho_VendasBrecho_VendaBrechoId",
                        column: x => x.VendaBrechoId,
                        principalTable: "VendasBrecho",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ItensVendaBazar_PecaId",
                table: "ItensVendaBazar",
                column: "PecaId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensVendaBazar_VendaBazarId",
                table: "ItensVendaBazar",
                column: "VendaBazarId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensVendaBrecho_PecaId",
                table: "ItensVendaBrecho",
                column: "PecaId");

            migrationBuilder.CreateIndex(
                name: "IX_ItensVendaBrecho_VendaBrechoId",
                table: "ItensVendaBrecho",
                column: "VendaBrechoId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosCaixa_FamiliaId",
                table: "LancamentosCaixa",
                column: "FamiliaId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosCaixa_ParoquiaId",
                table: "LancamentosCaixa",
                column: "ParoquiaId");

            migrationBuilder.CreateIndex(
                name: "IX_LancamentosCaixa_VendaBrechoId",
                table: "LancamentosCaixa",
                column: "VendaBrechoId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pecas_ParoquiaId",
                table: "Pecas",
                column: "ParoquiaId");

            migrationBuilder.CreateIndex(
                name: "IX_Pecas_RemessaId",
                table: "Pecas",
                column: "RemessaId");

            migrationBuilder.CreateIndex(
                name: "IX_VendasBrecho_ParoquiaId",
                table: "VendasBrecho",
                column: "ParoquiaId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItensVendaBazar");

            migrationBuilder.DropTable(
                name: "ItensVendaBrecho");

            migrationBuilder.DropTable(
                name: "LancamentosCaixa");

            migrationBuilder.DropTable(
                name: "VendasBazar");

            migrationBuilder.DropTable(
                name: "Pecas");

            migrationBuilder.DropTable(
                name: "VendasBrecho");

            migrationBuilder.DropTable(
                name: "Remessas");
        }
    }
}
