using Caritas.Models.DTOs.Usuario;
using Caritas.Models.Entities;
using Caritas.Repository.Repositories;

namespace Caritas.Service.Services;

public class UsuarioService(UsuarioRepository repository)
{
    public async Task<Usuario> CreateAsync(UsuarioCreateDto dto)
    {
        var existing = await repository.GetByEmailAsync(dto.Email);
        if (existing is not null)
            throw new InvalidOperationException("Já existe um usuário com este e-mail.");

        var usuario = new Usuario
        {
            Nome           = dto.Nome,
            Sobrenome      = dto.Sobrenome,
            Email          = dto.Email,
            Senha          = dto.Senha, // TODO: adicionar hash antes de produção
            Telefone       = dto.Telefone,
            DataNascimento = dto.DataNascimento,
            IdParoquia     = dto.IdParoquia,
            IdPerfil       = dto.IdPerfil,
            Ativo          = true,
            DataCriacao    = DateTime.UtcNow
        };

        return await repository.AddAsync(usuario);
    }
    public async Task<Usuario> UpdateAsync(int id, UpdateUsuarioDto dto)
    {
        var usuario = await repository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Nome           = dto.Nome ?? usuario.Nome;
        usuario.Sobrenome      = dto.Sobrenome ?? usuario.Sobrenome;
        usuario.Telefone       = dto.Telefone ?? usuario.Telefone;
        usuario.DataNascimento = dto.DataNascimento ?? usuario.DataNascimento;
        usuario.IdParoquia     = dto.IdParoquia ?? usuario.IdParoquia;
        usuario.IdPerfil       = dto.IdPerfil ?? usuario.IdPerfil;

        return await repository.UpdateAsync(usuario);
    }

    public async Task DeactivateAsync(int id)
    {
        var usuario = await repository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Usuário com id {id} não encontrado.");

        usuario.Ativo            = false;
        usuario.DataInativacao   = DateTime.UtcNow;

        await repository.UpdateAsync(usuario);
    }
}