using Caritas.Models.Constants;
using Caritas.Models.Entities;
using Caritas.Repository.Context;
using Caritas.WebApi.Authorization;
using Caritas.WebApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using Caritas.Models.Settings;
using Caritas.Models.Interfaces.Services;
using Caritas.Service.Services;
using Caritas.Service.Services.Email;
using Caritas.Service.Session;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddCors(opt =>
    opt.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CaritasDbContext>();
    await db.Database.MigrateAsync();

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

    // Seed do admin inicial
    // TODO: credenciais do admin de seed fixas temporariamente — mover para
    // configuração/secrets (env vars / user-secrets) antes de produção.
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

        if (!userManager.Users.Any(u => u.UsuarioAdmin && u.Ativo))
        {
            const string adminEmail = "dev@caritas.com";
            const string adminPassword = "Dev@12345";

            var admin = await userManager.FindByEmailAsync(adminEmail);
            if (admin is null)
            {
                admin = new Usuario
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    Nome = "Dev",
                    Sobrenome = "User",
                    Ativo = true,
                    UsuarioAdmin = true,
                    CriadoEm = DateTime.UtcNow
                };
                await userManager.CreateAsync(admin, adminPassword);
            }
            else
            {
                admin.UsuarioAdmin = true;
                admin.Ativo = true;
                await userManager.UpdateAsync(admin);
            }

            if (!await userManager.IsInRoleAsync(admin, PerfisPadrao.Admin))
                await userManager.AddToRoleAsync(admin, PerfisPadrao.Admin);
        }
    }
}

app.UseMiddleware<ErrorHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();