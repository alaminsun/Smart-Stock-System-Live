# 1. Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# ফোল্ডারের ভেতর থেকে .csproj ফাইলটি কপি করা হচ্ছে
COPY ["SmartStock.Api/SmartStock.Api.csproj", "SmartStock.Api/"]
RUN dotnet restore "SmartStock.Api/SmartStock.Api.csproj"

# বাকি সব ফাইল কপি করা হচ্ছে
COPY . .

# ফোল্ডারের ভেতর ঢুকে প্রজেক্ট পাবলিশ করা হচ্ছে
WORKDIR "/src/SmartStock.Api"
RUN dotnet publish "SmartStock.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 2. Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "SmartStock.Api.dll"]