using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SmartStock.Api.Authorization
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // ১. যদি ইউজার Admin রোলে থাকে, তবে স্বয়ংক্রিয়ভাবে সব পারমিশন পাবে (Case-insensitive)
            if (context.User.IsInRole("Admin") || 
                context.User.Claims.Any(c => 
                    (c.Type == ClaimTypes.Role || c.Type.Equals("role", StringComparison.OrdinalIgnoreCase) || c.Type.EndsWith("/role", StringComparison.OrdinalIgnoreCase)) &&
                    string.Equals(c.Value, "Admin", StringComparison.OrdinalIgnoreCase)))
            {
                context.Succeed(requirement);
                return Task.CompletedTask;
            }

            // ২. ইউজারের ক্লেইম থেকে 'Permission' চেক করা (Case-insensitive)
            var hasPermission = context.User.Claims
                .Any(x => (x.Type.Equals("Permission", StringComparison.OrdinalIgnoreCase) || 
                           x.Type.EndsWith("/permission", StringComparison.OrdinalIgnoreCase)) &&
                          string.Equals(x.Value, requirement.Permission, StringComparison.OrdinalIgnoreCase));

            if (hasPermission)
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
