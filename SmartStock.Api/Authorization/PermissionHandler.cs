using Microsoft.AspNetCore.Authorization;

namespace SmartStock.Api.Authorization
{
    public class PermissionHandler : AuthorizationHandler<PermissionRequirement>
    {
        protected override Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
        {
            // ইউজারের ক্লেইম থেকে 'Permission' টাইপ ক্লেইমগুলো চেক করা হচ্ছে
            var permissions = context.User.Claims
                .Where(x => x.Type == "Permission" && x.Value == requirement.Permission);

            if (permissions.Any())
            {
                context.Succeed(requirement);
            }

            return Task.CompletedTask;
        }
    }
}
