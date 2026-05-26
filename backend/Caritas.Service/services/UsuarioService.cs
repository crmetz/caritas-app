using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Models.Interfaces;
using Caritas.Repository.Repositories;
using Caritas.Service.Mappers;

namespace Caritas.Service.Services;

public class UsuariosService
{

    private readonly IUsuarioRepository _usuarioRepository;

    public UsuariosService(IUsuarioRepository usuarioRepository)
    {
        _usuarioRepository = usuarioRepository;
    }

    public async Task<UsuarioDto> GetByIdAsync(int id)
        {
            var usuario = await _usuarioRepository.GetByIdAsync(id);

            if(usuario == null) throw new KeyNotFoundException($"Usuario com id {id} não encontrada.");
            return usuario.ToDto();
        }

    public async Task<Usuario> CreateAsync(CreateUsuarioDto dto)
    {
        var existing = await _usuarioRepository.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Já existe um usuário com este e-mail.");

        var usuario = new Usuario
        {
            Nome           = dto.Nome,
            Sobrenome      = dto.Sobrenome,
            Email          = dto.Email,
            Senha          = "Teste", //colocar uma senha ou hash padrão
            Telefone       = dto.Telefone,
            DataNasc = dto.DataNasc,
            PerfilId       = dto.PerfilId,
            Ativo          = true,
        };

        return await _usuarioRepository.AddAsync(usuario);
    }
    public async Task<Usuario> UpdateAsync(int id, UpdateUsuarioDto dto)
    {
        var usuario = await _usuarioRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Nome           = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome      = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone       = dto.Telefone ?? usuario.Telefone;
        usuario.DataNasc       = dto.DataNasc ?? usuario.DataNasc;
        usuario.PerfilId       = dto.PerfilId ?? usuario.PerfilId;

        await _usuarioRepository.UpdateAsync(usuario);
        return usuario;
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