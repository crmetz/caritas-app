using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Caritas.Repository.Migrations
{
    /// <inheritdoc />
    public partial class EstadoInicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Endereco",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Rua = table.Column<string>(type: "text", nullable: true),
                    Numero = table.Column<string>(type: "text", nullable: true),
                    Cep = table.Column<string>(type: "text", nullable: true),
                    Bairro = table.Column<string>(type: "text", nullable: true),
                    Cidade = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Endereco", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Perfil",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Perfil", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Permissao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Codigo = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Permissao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Paroquia",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: false),
                    IdEndereco = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Paroquia", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Paroquia_Endereco_IdEndereco",
                        column: x => x.IdEndereco,
                        principalTable: "Endereco",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "PerfilPermissao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdPerfil = table.Column<int>(type: "integer", nullable: true),
                    IdPermissao = table.Column<int>(type: "integer", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PerfilPermissao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PerfilPermissao_Perfil_IdPerfil",
                        column: x => x.IdPerfil,
                        principalTable: "Perfil",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PerfilPermissao_Permissao_IdPermissao",
                        column: x => x.IdPermissao,
                        principalTable: "Permissao",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Notificacao",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "text", nullable: true),
                    Mensagem = table.Column<string>(type: "text", nullable: true),
                    TipoDestinatario = table.Column<string>(type: "text", nullable: true),
                    IdParoquiaEmissora = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notificacao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notificacao_Paroquia_IdParoquiaEmissora",
                        column: x => x.IdParoquiaEmissora,
                        principalTable: "Paroquia",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Usuario",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "text", nullable: true),
                    Sobrenome = table.Column<string>(type: "text", nullable: true),
                    Senha = table.Column<string>(type: "text", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Telefone = table.Column<string>(type: "text", nullable: true),
                    DataNascimento = table.Column<string>(type: "text", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataInativacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IdCriador = table.Column<int>(type: "integer", nullable: true),
                    IdParoquia = table.Column<int>(type: "integer", nullable: true),
                    IdPerfil = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuario", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Usuario_Paroquia_IdParoquia",
                        column: x => x.IdParoquia,
                        principalTable: "Paroquia",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Usuario_Perfil_IdPerfil",
                        column: x => x.IdPerfil,
                        principalTable: "Perfil",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Usuario_Usuario_IdCriador",
                        column: x => x.IdCriador,
                        principalTable: "Usuario",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Notificacao_IdParoquiaEmissora",
                table: "Notificacao",
                column: "IdParoquiaEmissora");

            migrationBuilder.CreateIndex(
                name: "IX_Paroquia_IdEndereco",
                table: "Paroquia",
                column: "IdEndereco",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Perfil_Nome",
                table: "Perfil",
                column: "Nome",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PerfilPermissao_IdPerfil",
                table: "PerfilPermissao",
                column: "IdPerfil");

            migrationBuilder.CreateIndex(
                name: "IX_PerfilPermissao_IdPermissao",
                table: "PerfilPermissao",
                column: "IdPermissao");

            migrationBuilder.CreateIndex(
                name: "IX_Permissao_Codigo",
                table: "Permissao",
                column: "Codigo",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_IdCriador",
                table: "Usuario",
                column: "IdCriador");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_IdParoquia",
                table: "Usuario",
                column: "IdParoquia");

            migrationBuilder.CreateIndex(
                name: "IX_Usuario_IdPerfil",
                table: "Usuario",
                column: "IdPerfil");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Notificacao");

            migrationBuilder.DropTable(
                name: "PerfilPermissao");

            migrationBuilder.DropTable(
                name: "Usuario");

            migrationBuilder.DropTable(
                name: "Permissao");

            migrationBuilder.DropTable(
                name: "Paroquia");

            migrationBuilder.DropTable(
                name: "Perfil");

            migrationBuilder.DropTable(
                name: "Endereco");
        }
    }
}
