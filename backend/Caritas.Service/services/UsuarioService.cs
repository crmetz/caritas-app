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

    public UsuariosService(IUsuarioRepository usuarioRepository)
    {
        _usuarioRepository = usuarioRepository;
    }

     public async Task<PagedResponseDto<UsuarioResponseDto>> GetPagedAsync(int page, int pageSize)
        {
            var paged = await _usuarioRepository.GetPagedAsync(page, pageSize);

            return new PagedResponseDto<UsuarioResponseDto>
            {
                Items = paged.Items.Select(p => p.ToResponseDto()),
                TotalCount = paged.TotalCount
            };
        }

    public async Task<UsuarioDto> GetByIdAsync(int id)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id);

        if (usuario == null) throw new KeyNotFoundException($"Usuario com id {id} não encontrada.");
        return usuario.ToDto();
    }

    public async Task<UsuarioDto> CreateAsync(Usuario usuario, IList<int> paroquiasPermitidas)
    {
        foreach (var paroquiaId in paroquiasPermitidas)
            usuario.UsuarioParoquias.Add(new UsuarioParoquia { ParoquiaId = paroquiaId });

        await _usuarioRepository.UpdateAsync(usuario);
        return usuario.ToDto();
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

        usuario.Nome = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone = dto.Telefone ?? usuario.Telefone;
        usuario.DataNasc = dto.DataNasc ?? usuario.DataNasc;
        usuario.Cpf = dto.Cpf ?? usuario.Cpf;

        var paroquiasToRemove = usuario.UsuarioParoquias
            .Where(up => !dto.ParoquiasPermitidas.Contains(up.ParoquiaId))
            .ToList();

        foreach (var up in paroquiasToRemove)
            usuario.UsuarioParoquias.Remove(up);

        foreach (var paroquiaId in dto.ParoquiasPermitidas)
            if (!usuario.UsuarioParoquias.Any(up => up.ParoquiaId == paroquiaId))
                usuario.UsuarioParoquias.Add(new UsuarioParoquia { ParoquiaId = paroquiaId });

        await _usuarioRepository.UpdateAsync(usuario);
        return usuario.ToDto();
    }

    public async Task DeactivateAsync(int id)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Ativo = false;
        usuario.DataInativacao = DateTime.UtcNow;

        await _usuarioRepository.UpdateAsync(usuario);
    }
}