using Caritas.Models.DTOs.Pagination;
using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Mappers;
using System.Security.Cryptography;

namespace Caritas.Service.Services;

public class UsuariosService
{

    private readonly IUsuarioRepository _usuarioRepository;
    private readonly IEmailService _emailService;

    public UsuariosService(IUsuarioRepository usuarioRepository, IEmailService emailService)
    {
        _usuarioRepository = usuarioRepository;
        _emailService = emailService;
    }

    public async Task<PagedResponseDto<UsuarioDto>> GetPagedAsync(int page, int pageSize)
    {
        var paged = await _usuarioRepository.GetPagedAsync(page, pageSize);

        return new PagedResponseDto<UsuarioDto>
        {
            Items = paged.Items.Select(p => p.ToDto()),
            TotalCount = paged.TotalCount
        };
    }

    public async Task<UsuarioDto> GetByIdAsync(int id)
    {
            var usuario = await _usuarioRepository.GetByIdAsync(id);

            if(usuario == null) throw new KeyNotFoundException($"Usuario com id {id} não encontrada.");
            return usuario.ToDto();
    }

    public async Task<UsuarioDto> CreateAsync(CreateUsuarioDto dto)
    {
        var existing = await _usuarioRepository.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Já existe um usuário com este e-mail.");

        var tempPassword = GenerateTemporaryPassword();

        var usuario = new Usuario
        {
            Nome = dto.Nome,
            Sobrenome = dto.Sobrenome,
            Email = dto.Email,
            // TODO: armazenar senha hash. por enquanto é uma senha temporária em plaintext
            Senha = tempPassword,
            Telefone = dto.Telefone,
            DataNasc = dto.DataNasc,
            PerfilId = dto.PerfilId,
            Ativo = true,
        };

        var created = await _usuarioRepository.AddAsync(usuario);

        //funciona, mas deixei comentado enquanto não temos login
        //try
        //{
        //    await _emailService.SendAsync(
        //        to: dto.Email,
        //        subject: AccountCreatedEmail.Subject,
        //        body: AccountCreatedEmail.Build(dto.Nome));
        //}
        //catch (Exception ex)
        //{
        //    throw new Exception("Usuário criado, mas falha ao enviar email de boas-vindas.", ex);
        //}

        return created.ToDto();
    }

    private static string GenerateTemporaryPassword(int length = 12)
    {
        const string allowed = "ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789!@$?_-";
        var bytes = RandomNumberGenerator.GetBytes(length);
        var chars = new char[length];
        for (int i = 0; i < length; i++)
        {
            chars[i] = allowed[bytes[i] % allowed.Length];
        }
        return new string(chars);
    }

    public async Task<UsuarioDto> UpdateAsync(int id, UpdateUsuarioDto dto)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Nome           = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome      = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone       = dto.Telefone ?? usuario.Telefone;
        usuario.DataNasc       = dto.DataNasc ?? usuario.DataNasc;
        usuario.PerfilId       = dto.PerfilId ?? usuario.PerfilId;

        await _usuarioRepository.UpdateAsync(usuario);
        return usuario.ToDto();
    }

    public async Task DeactivateAsync(int id)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Ativo            = false;
        usuario.DataInativacao   = DateTime.UtcNow;

        await _usuarioRepository.UpdateAsync(usuario);
    }
}