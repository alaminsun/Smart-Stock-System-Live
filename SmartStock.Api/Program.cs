using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.HttpOverrides;
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
using OpenApiModels = Microsoft.OpenApi;

var builder = WebApplication.CreateBuilder(args);

// Kestrel লিমিট কনফিগারেশন
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestHeadersTotalSize = 524288; // 512 KB
    options.Limits.MaxRequestHeaderCount = 200;
    options.Limits.MaxRequestLineSize = 131072;       // 128 KB
    options.Limits.Http2.MaxRequestHeaderFieldSize = 131072; // 128 KB
});

// ডাটাবেস কনফিগারেশন (PostgreSQL)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// আইডেন্টিটি কনফিগারেশন
builder.Services.AddIdentity<ApplicationUser, IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

// অথরাইজেশন হ্যান্ডলার ও প্রোভাইডার
builder.Services.AddSingleton<IAuthorizationHandler, PermissionHandler>();
builder.Services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
builder.Services.AddAuthorization();

// JWT অথেন্টিকেশন কনফিগারেশন
var key = Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!);
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
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();

// ডোমেইন সার্ভিসেস
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddHttpClient<IGeminiService, GeminiService>();
builder.Services.AddHttpContextAccessor();

// Swagger কনফিগারেশন
builder.Services.AddSwaggerGen(opt =>
{
    opt.SwaggerDoc("v1", new OpenApiModels.OpenApiInfo { Title = "SmartStock API", Version = "v1" });

    // "/" ব্যবহার করলে Swagger স্বয়ংক্রিয়ভাবে যেকোনো বর্তমান ডোমেইন ও প্রোটোকল (HTTPS/HTTP) ব্যবহার করে
    opt.AddServer(new OpenApiModels.OpenApiServer
    {
        Url = "/",
        Description = "Default Server (Current Domain)"
    });
    opt.AddServer(new OpenApiModels.OpenApiServer
    {
        Url = "https://smart-stock-system-live.onrender.com",
        Description = "Render Live Server"
    });

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

// CORS পলিসি (Vercel, Render, Localhost ইত্যাদি যেকোনো ক্লায়েন্ট ডাইনামিকালি সাপোর্ট করার জন্য)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSmartStockClients", policy =>
    {
        policy.SetIsOriginAllowed(origin => true)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ১. Render / Cloudflare রিভার্স প্রক্সির জন্য Forwarded Headers কনফিগারেশন
var forwardedHeadersOptions = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
};
forwardedHeadersOptions.KnownIPNetworks.Clear();
forwardedHeadersOptions.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeadersOptions);

// ২. Swagger প্রোডাকশন ও ডেভেলপমেন্ট উভয়ের জন্যই সক্রিয় করা
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartStock API v1");
    c.RoutePrefix = "swagger";
});

// ৩. CORS মিডলওয়্যার
app.UseRouting();
app.UseCors("AllowSmartStockClients");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// ডাটাবেস মাইগ্রেশন ও রোল সিডিং
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        context.Database.Migrate();

        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

        if (!context.Categories.Any())
        {
            context.Categories.AddRange(
                new Category { Name = "Electronics", Description = "Gadgets and devices" },
                new Category { Name = "Groceries", Description = "Daily food items" },
                new Category { Name = "Furniture", Description = "Home and office furniture" }
            );
            await context.SaveChangesAsync();
        }

        string[] roles = { "Admin", "Staff" };
        foreach (var roleName in roles)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }

            var role = await roleManager.FindByNameAsync(roleName);
            var existingClaims = await roleManager.GetClaimsAsync(role!);

            if (roleName == "Admin")
            {
                var allPermissions = new List<string>();
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

                foreach (var permission in allPermissions)
                {
                    if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == permission))
                    {
                        await roleManager.AddClaimAsync(role!, new System.Security.Claims.Claim("Permission", permission));
                    }
                }
            }
            else if (roleName == "Staff")
            {
                var staffPermissions = new List<string>
                {
                    SmartStock.Api.Constants.Permissions.Dashboard.View,
                    SmartStock.Api.Constants.Permissions.Products.View,
                    SmartStock.Api.Constants.Permissions.Categories.View,
                    SmartStock.Api.Constants.Permissions.Inventory.View,
                    SmartStock.Api.Constants.Permissions.Customers.View,
                    SmartStock.Api.Constants.Permissions.Suppliers.View,
                    SmartStock.Api.Constants.Permissions.Invoices.View,
                    SmartStock.Api.Constants.Permissions.Invoices.Create
                };

                foreach (var permission in staffPermissions)
                {
                    if (!existingClaims.Any(c => c.Type == "Permission" && c.Value == permission))
                    {
                        await roleManager.AddClaimAsync(role!, new System.Security.Claims.Claim("Permission", permission));
                    }
                }
            }
        }

        // ডিফল্ট এডমিন ইউজার সিড করা (যদি না থাকে)
        var adminEmail = "admin@smartstock.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = "admin",
                Email = adminEmail,
                FullName = "Super Admin",
                CompanyName = "SmartStock Live",
                EmailConfirmed = true
            };
            var createResult = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // ডিফল্ট স্টাফ ইউজার সিড করা (alaminsun@test.com / Test@123)
        var staffEmail = "alaminsun@test.com";
        var staffUser = await userManager.FindByEmailAsync(staffEmail);
        if (staffUser == null)
        {
            staffUser = new ApplicationUser
            {
                UserName = "staff",
                Email = staffEmail,
                FullName = "Staff Member",
                CompanyName = "SmartStock Live",
                EmailConfirmed = true
            };
            var staffResult = await userManager.CreateAsync(staffUser, "Test@123");
            if (staffResult.Succeeded)
            {
                await userManager.AddToRoleAsync(staffUser, "Staff");
            }
        }

        // sunmoon843@gmail.com কে Admin রোলে নিশ্চিত করা
        var ownerUser = await userManager.FindByEmailAsync("sunmoon843@gmail.com");
        if (ownerUser != null && !await userManager.IsInRoleAsync(ownerUser, "Admin"))
        {
            await userManager.AddToRoleAsync(ownerUser, "Admin");
        }

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