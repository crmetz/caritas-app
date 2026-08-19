using Caritas.Models.Constants;
using Caritas.Models.Entities;
using Caritas.Models.Enums;
using Caritas.Models.Interfaces;
using Caritas.Models.Interfaces.Services;
using Caritas.Models.Settings;
using Caritas.Repository.Context;
using Caritas.Repository.Repositories;
using Caritas.Service;
using Caritas.Service.Services.Email;
using Caritas.Service.Session;
using Caritas.WebApi.Authorization;
using Caritas.WebApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading.RateLimiting;
using Caritas.Service.Services;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

// A API roda atrás do nginx (container do frontend), que repassa X-Forwarded-For.
// Sem isso, o rate limiter enxergaria o IP do proxy em toda requisição e um único
// atacante derrubaria o login de todos os usuários.
// KnownProxies/KnownIPNetworks são limpos porque o IP do container do nginx é dinâmico;
// é seguro aqui porque o backend não é publicado — só é alcançável pelo proxy.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddDbContext<CaritasDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddIdentityCore<Usuario>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddRoles<Perfil>()
.AddEntityFrameworkStores<CaritasDbContext>()
.AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key não configurado.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
    };
});

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Digite: Bearer {seu token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id   = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});


builder.Services.AddScoped<IAuthorizationHandler, PermissionAuthorizationHandler>();
builder.Services.AddAuthorization(options =>
{
    foreach (var permission in PermissionService.AllValues)
        options.AddPolicy(permission, p => p.AddRequirements(new PermissionRequirement(permission)));
});

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentSession, CurrentSession>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<IEmailService, EmailService>();

// Estoque module
builder.Services.AddScoped<IItemRepository, ItemRepository>();
builder.Services.AddScoped<IEstoqueRepository, EstoqueRepository>();
builder.Services.AddScoped<IMovimentacaoRepository, MovimentacaoRepository>();
builder.Services.AddScoped<IDoadorRepository, DoadorRepository>();
builder.Services.AddScoped<IDoacaoRepository, DoacaoRepository>();
builder.Services.AddScoped<IConfiguracaoCestaRepository, ConfiguracaoCestaRepository>();
builder.Services.AddScoped<ILoteCestaRepository, LoteCestaRepository>();
builder.Services.AddScoped<IMovimentacaoCestaRepository, MovimentacaoCestaRepository>();
builder.Services.AddScoped<IEntregaRepository, EntregaRepository>();

builder.Services.AddScoped<IItemService, ItemService>();
builder.Services.AddScoped<IEstoqueService, EstoqueService>();
builder.Services.AddScoped<IMovimentacaoService, MovimentacaoService>();
builder.Services.AddScoped<IDoadorService, DoadorService>();
builder.Services.AddScoped<IDoacaoService, DoacaoService>();
builder.Services.AddScoped<IConfiguracaoCestaService, ConfiguracaoCestaService>();
builder.Services.AddScoped<IMontagemCestaService, MontagemCestaService>();
builder.Services.AddScoped<ILoteCestaService, LoteCestaService>();
builder.Services.AddScoped<IEntregaService, EntregaService>();

// Rate limiting nos endpoints anônimos de autenticação, particionado por IP do cliente,
// para conter tentativas de força bruta contra o login.
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(RateLimitPolicies.Auth, http =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: http.Connection.RemoteIpAddress?.ToString() ?? "desconhecido",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            }));
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CaritasDbContext>();
    await db.Database.MigrateAsync();

    // Seed dos gêneros de alimento (entregue pré-populado; idempotente).
    if (!await db.Alimentos.AnyAsync())
    {
        db.Alimentos.AddRange(
            new Alimento { Descricao = "Arroz", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Feijão", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Farinha", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Açúcar", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Sal", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Macarrão", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Café", FormaMedida = FormaMedida.Peso },
            new Alimento { Descricao = "Óleo", FormaMedida = FormaMedida.Volume },
            new Alimento { Descricao = "Leite", FormaMedida = FormaMedida.Volume },
            new Alimento { Descricao = "Ovo", FormaMedida = FormaMedida.Unidade });
        await db.SaveChangesAsync();
    }

    // Seed diocese
    if (!db.Paroquias.Any(p => p.Raiz))
    {
        db.Paroquias.Add(new Paroquia
        {
            Nome = "Diocese de Caxias do Sul",
            Raiz = true,
            Ativa = true,
            CriadoEm = DateTime.UtcNow,
            AtualizadoEm = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    // Seed do admin inicial.
    // As credenciais vêm da configuração (SeedAdmin__Email / SeedAdmin__Password).
    // Em desenvolvimento há um fallback fixo por conveniência; em produção, sem essas
    // variáveis definidas, nenhum usuário admin é criado.
    {
        using var seedScope = app.Services.CreateScope();
        var userManager = seedScope.ServiceProvider.GetRequiredService<UserManager<Usuario>>();
        var roleManager = seedScope.ServiceProvider.GetRequiredService<RoleManager<Perfil>>();

        if (await roleManager.FindByNameAsync(PerfisPadrao.Admin) is null)
        {
            await roleManager.CreateAsync(new Perfil
            {
                Name = PerfisPadrao.Admin,
                Estatico = true,
                Descricao = "Perfil de admnistrador do sistema"
            });
        }

        var adminRole = await roleManager.FindByNameAsync(PerfisPadrao.Admin);
        if (adminRole != null)
        {
            var existingPermissions = (await roleManager.GetClaimsAsync(adminRole))
                .Where(c => c.Type == Permissions.ClaimType)
                .Select(c => c.Value)
                .ToHashSet();

            foreach (var value in PermissionService.AllValues)
            {
                if (!existingPermissions.Contains(value))
                    await roleManager.AddClaimAsync(
                        adminRole,
                        new System.Security.Claims.Claim(Permissions.ClaimType, value));
            }
        }

        var adminEmail = app.Configuration["SeedAdmin:Email"];
        var adminPassword = app.Configuration["SeedAdmin:Password"];

        if (app.Environment.IsDevelopment())
        {
            adminEmail = string.IsNullOrWhiteSpace(adminEmail) ? "dev@caritas.com" : adminEmail;
            adminPassword = string.IsNullOrWhiteSpace(adminPassword) ? "Dev@12345" : adminPassword;
        }

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
        {
            app.Logger.LogWarning(
                "SeedAdmin:Email/SeedAdmin:Password não configurados — nenhum usuário admin foi criado.");
        }
        else if (!userManager.Users.Any(u => u.UsuarioAdmin && u.Ativo))
        {
            var admin = await userManager.FindByEmailAsync(adminEmail);
            if (admin is null)
            {
                admin = new Usuario
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    Nome = "Admin",
                    Sobrenome = "Cáritas",
                    Ativo = true,
                    UsuarioAdmin = true,
                    CriadoEm = DateTime.UtcNow
                };

                var criacao = await userManager.CreateAsync(admin, adminPassword);
                if (!criacao.Succeeded)
                {
                    // Senha fraca demais para as regras do Identity (mín. 8 caracteres,
                    // com dígito e maiúscula) é o motivo mais provável.
                    app.Logger.LogError(
                        "Falha ao criar o usuário admin de seed: {Erros}",
                        string.Join("; ", criacao.Errors.Select(e => e.Description)));
                    admin = null;
                }
            }
            else
            {
                admin.UsuarioAdmin = true;
                admin.Ativo = true;
                await userManager.UpdateAsync(admin);
            }

            if (admin is not null && !await userManager.IsInRoleAsync(admin, PerfisPadrao.Admin))
                await userManager.AddToRoleAsync(admin, PerfisPadrao.Admin);
        }
    }

    // Dados de exemplo só em desenvolvimento (idempotente). Uma falha aqui não deve derrubar a API.
    if (app.Environment.IsDevelopment())
    {
        try
        {
            await Caritas.WebApi.Seed.DevDataSeeder.SeedAsync(db);
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "Falha ao aplicar o seed de desenvolvimento.");
        }
    }
}

// Precisa vir antes de tudo: reescreve o IP do cliente a partir do X-Forwarded-For
// do nginx, que é o que o rate limiter usa para particionar.
app.UseForwardedHeaders();

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Health check para o proxy/monitoramento verificarem a API sem autenticar.
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

app.Run();