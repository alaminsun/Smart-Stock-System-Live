# .NET 10 SDK for building the app
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SmartStock.Api.csproj", "."]
RUN dotnet restore "./SmartStock.Api.csproj"
COPY . .
RUN dotnet publish "./SmartStock.Api.csproj" -c Release -o /app/publish

# .NET 10 Runtime for production
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SmartStock.Api.dll"]