FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Caritas.WebApi/Caritas.WebApi.csproj", "Caritas.WebApi/"]
COPY ["Caritas.Service/Caritas.Service.csproj", "Caritas.Service/"]
COPY ["Caritas.Repository/Caritas.Repository.csproj", "Caritas.Repository/"]
COPY ["Caritas.Models/Caritas.Models.csproj", "Caritas.Models/"]
RUN dotnet restore "Caritas.WebApi/Caritas.WebApi.csproj"
COPY . .
WORKDIR "/src/Caritas.WebApi"
RUN dotnet build "Caritas.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "Caritas.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Caritas.WebApi.dll"]
