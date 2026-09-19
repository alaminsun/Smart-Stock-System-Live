using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace SmartStock.Api.Authorization
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // ১. যদি ইউজার Admin রোলে থাকে, তবে স্বয়ংক্রিয়ভাবে সব পারমিশন পাবে
            if (context.User.IsInRole("Admin") || 
                context.User.HasClaim(ClaimTypes.Role, "Admin") ||
                context.User.HasClaim("role", "Admin"))
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
