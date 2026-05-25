using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartStock.Api.Authorization;
using SmartStock.Api.Data;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;
using SmartStock.Api.Repositories;
using SmartStock.Api.Services;
using System.Text;
// Swashbuckle এর জন্য Alias নিশ্চিত করা
using OpenApiModels = Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Kestrel লিমিট বাড়ানো (বড় JWT টোকেন হ্যান্ডেল করার জন্য)
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestHeadersTotalSize = 524288; // 512 KB
    options.Limits.MaxRequestHeaderCount = 200;
    options.Limits.MaxRequestLineSize = 131072;       // 128 KB
    options.Limits.Http2.MaxRequestHeaderFieldSize = 131072; // 128 KB
    //options.Limits.MaxRequestHeadersTotalSize = 65536; // 64 KB
    //options.Limits.MaxRequestLineSize = 32768;       // 32 KB
    //options.Limits.Http2.MaxRequestHeaderFieldSize = 32768; // 32 KB
});

//// ডাটাবেস কনফিগারেশন
//builder.Services.AddDbContext<AppDbContext>(options =>
//    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// আইডেন্টিটি কনফিগারেশন
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// হ্যান্ডলার রেজিস্টার করা
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();

// ১. ডাইনামিক পলিসি প্রোভাইডার রেজিস্টার করা
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();

// ২. কাস্টম পারমিশন হ্যান্ডলার রেজিস্টার করা (এটি আমরা আগের ধাপে করেছিলাম)
// builder.Services.AddScoped<IAuthorizationHandler, PermissionHandler>(); // Remove duplicate

builder.Services.AddAuthorization(); // এখন এটি খালি রাখলেও সমস্যা নেই

// JWT অথেন্টিকেশন কনফিগারেশন
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
builder.Services.AddAuthentication(options => {
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}) // এখানে ব্র্যাকেট শেষ হবে
.AddJwtBearer(options => {
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key),
        //RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
builder.Services.AddHttpContextAccessor();
// --- SWAGGER CONFIGURATION (সঠিক Alias ব্যবহার করে) ---
builder.Services.AddSwaggerGen(opt =>
{
    opt.SwaggerDoc("v1", new OpenApiModels.OpenApiInfo { Title = "SmartStock API", Version = "v1" });

    var securityScheme = new OpenApiModels.OpenApiSecurityScheme
    {
        Name = "JWT Authentication",
        Description = "Enter JWT Bearer token **_only_**",
        In = OpenApiModels.ParameterLocation.Header,
        Type = OpenApiModels.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    };

    opt.AddSecurityDefinition(JwtBearerDefaults.AuthenticationScheme, securityScheme);

    opt.AddSecurityRequirement(doc => new OpenApiModels.OpenApiSecurityRequirement
    {
        {
            new OpenApiModels.OpenApiSecuritySchemeReference(JwtBearerDefaults.AuthenticationScheme, doc),
            new List<string>()
        }
    });
});
//builder.Services.AddSwaggerGen();

// CORS কনফিগারেশন
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200", // আপনার লোকাল অ্যাঙ্গুলার লিংক
            "https://smart-stock-system-live.vercel.app" // 🚀 আপনার নতুন Vercel লাইভ লিংক (শেষে কোন '/' রাখবেন না)
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials(); // যদি আপনার অথেনটিকেশনে কুকি বা টোকেন লাগে
    });
});

var app = builder.Build();

// ১. CORS সবার আগে (বাকি সবকিছুর আগে)
app.UseCors("AllowAll");

// মিডলওয়্যার পাইপলাইন
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection(); // লোকালহোস্টে অনেক সময় এটি সমস্যার কারণ হয়, তাই সাময়িকভাবে কমেন্ট করা হলো

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// অটোমেটিক রোল সিডিং (Seed Roles)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        
        // ১. ডাটাবেস মাইগ্রেশন অটোমেটিক অ্যাপ্লাই করা
        context.Database.Migrate();

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        
        // ২. সিড ক্যাটাগরি (যদি খালি থাকে)
        if (!context.Categories.Any())
        {
            context.Categories.AddRange(
                new Category { Name = "Electronics", Description = "Gadgets and devices" },
                new Category { Name = "Groceries", Description = "Daily food items" },
                new Category { Name = "Furniture", Description = "Home and office furniture" }
            );
            await context.SaveChangesAsync();
        }

        // ৩. সিড রোলস
        string[] roles = { "Admin", "Staff" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }

            // Admin রোল-কে সব পারমিশন দেওয়া
            if (roleName == "Admin")
            {
                var role = await roleManager.FindByNameAsync(roleName);
                var allPermissions = new List<string>();

                // Reflection ব্যবহার করে সব পারমিশন একবারে নেওয়া
                var permissionClasses = typeof(SmartStock.Api.Constants.Permissions).GetNestedTypes();
                foreach (var pClass in permissionClasses)
                {
                    var fields = pClass.GetFields(System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.FlattenHierarchy);
                    foreach (var field in fields)
                    {
                        var value = field.GetValue(null)?.ToString();
                        if (value != null) allPermissions.Add(value);
                    }
                }

                var existingClaims = await roleManager.GetClaimsAsync(role!);
                foreach (var permission in allPermissions)
                {
                    if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == permission))
                    {
                        await roleManager.AddClaimAsync(role!, new System.Security.Claims.Claim("Permission", permission));
                    }
                }
            }
        }

        // ৪. সিড প্রোডাক্ট (যদি খালি থাকে)
        if (!context.Products.Any())
        {
            var category = await context.Categories.FirstOrDefaultAsync();
            if (category != null)
            {
                context.Products.Add(new Product
                {
                    Id = Guid.NewGuid(),
                    Name = "Sample Product",
                    SKU = "SAMPLE001",
                    CostPrice = 10,
                    SalePrice = 15,
                    Quantity = 100,
                    MinStockLevel = 10,
                    CategoryId = category.Id,
                    CreatedAt = DateTime.UtcNow
                });
                await context.SaveChangesAsync();
            }
        }
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating or seeding the database.");
    }
}

app.Run();