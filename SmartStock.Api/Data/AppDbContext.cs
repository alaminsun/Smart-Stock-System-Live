using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Models;
using System.Security.Claims;
using System.Text.Json;

namespace SmartStock.Api.Data
{

    
    public class AppDbContext : IdentityDbContext<ApplicationUser>
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        public AppDbContext(DbContextOptions<AppDbContext> options,
            IHttpContextAccessor httpContextAccessor ) : base(options) 
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<Product> Products { get; set; }
        public DbSet<NavigationMenu> NavigationMenus { get; set; }
        public DbSet<Category> Categories   { get; set; }
        public DbSet<InventoryTransaction> InventoryTransactions { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<GlobalSetting> GlobalSettings { get; set; }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            // ১. ডাটাবেসে সেভ করার আগে কি কি পরিবর্তন হচ্ছে তার একটি লিস্ট তৈরি করা
            var auditEntries = OnBeforeSaveChanges();

            // ২. মেইন ডাটাবেস টেবিলগুলোতে ডাটা সেভ করা
            var result = await base.SaveChangesAsync(cancellationToken);

            // ৩. মেইন ডাটা সেভ হওয়ার পর অডিট লগ টেবিলে ডাটা পুশ করা (কারণ আইডি জেনারেট হওয়া প্রয়োজন)
            if (auditEntries != null && auditEntries.Count > 0)
            {
                await OnAfterSaveChanges(auditEntries);
            }

            return result;
        }

        private List<AuditEntry> OnBeforeSaveChanges()
        {
            ChangeTracker.DetectChanges();
            var auditEntries = new List<AuditEntry>();

            // টোকেন থেকে কারেন্ট ইউজারের ইমেইল বা নাম নেওয়া
            var currentUser = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value
                              ?? _httpContextAccessor.HttpContext?.User?.Identity?.Name
                              ?? "System/Anonymous";

            foreach (var entry in ChangeTracker.Entries())
            {
                // AuditLogs টেবিল নিজের লগ নিজে ট্র্যাক করবে না (ইনফিনিট লুপ এড়াতে)
                if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                    continue;

                var auditEntry = new AuditEntry(entry)
                {
                    TableName = entry.Entity.GetType().Name,
                    // নোট: এখানে আপনি আপনার অথেন্টিকেশন বা টোকেন থেকে ইউজারের নাম পাস করতে পারেন। 
                    // সাময়িকভাবে এটি "System User" রাখছি, পরে আমরা এটিকে কারেন্ট ইউজারের সাথে বাইন্ড করব।
                    UserId = currentUser,
                };
                
                
                auditEntries.Add(auditEntry);

                foreach (var property in entry.Properties)
                {
                    string propertyName = property.Metadata.Name;
                    if (property.Metadata.IsPrimaryKey())
                    {
                        auditEntry.KeyValues[propertyName] = property.CurrentValue;
                        continue;
                    }

                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditEntry.Action = "Create";
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                            break;

                        case EntityState.Deleted:
                            auditEntry.Action = "Delete";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            break;

                        case EntityState.Modified:
                            if (property.IsModified)
                            {
                                auditEntry.Action = "Update";
                                auditEntry.OldValues[propertyName] = property.OriginalValue;
                                auditEntry.NewValues[propertyName] = property.CurrentValue;
                            }
                            break;
                    }
                }
            }

            return auditEntries;
        }

        private Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
        {
            foreach (var auditEntry in auditEntries)
            {
                AuditLogs.Add(auditEntry.ToAuditLog());
            }
            return base.SaveChangesAsync();
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ১. NavigationMenu কনফিগারেশন (Self-referencing relationship)
            modelBuilder.Entity<NavigationMenu>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Parent এবং Children এর মধ্যে সম্পর্ক স্থাপন
                entity.HasOne(d => d.Parent)
                    .WithMany(p => p.Children)
                    .HasForeignKey(d => d.ParentId)
                    .OnDelete(DeleteBehavior.Restrict); // প্যারেন্ট ডিলিট করা যাবে না যদি চাইল্ড থাকে

                entity.Property(e => e.Title).IsRequired().HasMaxLength(100);
                entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            });

            // ৩. Invoice টেবিলের ডেসিমাল কনফিগারেশন
            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.Property(i => i.TotalAmount).HasColumnType("decimal(18,2)");
                entity.Property(i => i.Discount).HasColumnType("decimal(18,2)");
                entity.Property(i => i.NetAmount).HasColumnType("decimal(18,2)");
                entity.Property(i => i.TaxRate).HasColumnType("decimal(5,2)");
                entity.Property(i => i.TaxAmount).HasColumnType("decimal(18,2)");
            });

            // ৪. InvoiceItem টেবিলের ডেসিমাল কনফিগারেশন
            modelBuilder.Entity<InvoiceItem>(entity =>
            {
                entity.Property(ii => ii.UnitPrice).HasColumnType("decimal(18,2)");
                entity.Property(ii => ii.SubTotal).HasColumnType("decimal(18,2)");
            });
        }
    }
}
