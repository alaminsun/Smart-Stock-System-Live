using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SmartStock.Api.Constants;
using SmartStock.Api.Models;
using System.Security.Claims;
using static SmartStock.Api.Models.DTOs.RoleDto;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RolesController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;

        public RolesController(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager)
        {
            _roleManager = roleManager;
            _userManager = userManager;
        }

        // ১. নতুন রোল তৈরি করা
        [HttpPost("create")]
        [Authorize(Policy = Permissions.Roles.Create)]
        public async Task<IActionResult> CreateRole([FromBody] RoleCreateDto model)
        {
            if (string.IsNullOrEmpty(model.RoleName)) return BadRequest("Role name is required");

            if (await _roleManager.RoleExistsAsync(model.RoleName))
                return BadRequest("Role already exists");
            
            //var roleExist = await _roleManager.RoleExistsAsync(roleName);
            var result = await _roleManager.CreateAsync(new IdentityRole(model.RoleName));
            if (result.Succeeded)
            {
                return Ok(new { message = $"Role {model.RoleName} created successfully" });
            }
            return BadRequest(result.Errors);
        }

        //// ২. ইউজারকে রোল অ্যাসাইন করা
        //[HttpPost("assign-to-user")]
        //public async Task<IActionResult> AssignRole([FromBody] UserRoleDto model)
        //{
        //    var user = await _userManager.FindByEmailAsync(model.Email);
        //    if (user == null) return NotFound("User not found");

        //    if (!await _roleManager.RoleExistsAsync(model.RoleName))
        //        return BadRequest("Role does not exist");
        //    var result = await _userManager.AddToRoleAsync(user, model.RoleName); // ইউজারকে রোল দেওয়া
        //    if (result.Succeeded)
        //        return Ok(new { message = $"Role {model.RoleName} assigned to {model.Email}" });

        //    return BadRequest(result.Errors);
        //}

        [HttpPost("assign-to-user")]
        [Authorize(Policy = Permissions.Users.Edit)] // User role management usually belongs to Users.Edit or a specific permission
        public async Task<IActionResult> AssignRole([FromBody] UserRoleDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null) return NotFound("User not found");

            if (!await _roleManager.RoleExistsAsync(model.RoleName))
                return BadRequest("Role does not exist");

            // ১. ইউজারের বর্তমান সব রোল খুঁজে বের করা
            var currentRoles = await _userManager.GetRolesAsync(user);

            // ২. পুরনো সব রোল রিমুভ করা (যাতে শুধু নতুন রোলটিই থাকে)
            if (currentRoles.Any())
            {
                await _userManager.RemoveFromRolesAsync(user, currentRoles);
            }

            // ৩. নতুন রোলটি অ্যাসাইন করা
            var result = await _userManager.AddToRoleAsync(user, model.RoleName);

            if (result.Succeeded)
                return Ok(new { message = $"Role updated to {model.RoleName} for {model.Email}" });

            return BadRequest(result.Errors);
        }

        // ৩. রোলে ডাইনামিক পারমিশন (Claim) যোগ করা
        [HttpPost("add-permission")]
        [Authorize(Policy = Permissions.Roles.Edit)]
        public async Task<IActionResult> AddPermissionToRole([FromBody] RolePermissionDto model)
        {
            var role = await _roleManager.FindByNameAsync(model.RoleName);
            if (role == null) return NotFound("Role not found");

            // সব পারমিশন 'Permission' টাইপ ক্লেইম হিসেবে সেভ হবে
            var result = await _roleManager.AddClaimAsync(role, new Claim("Permission", model.Permission));
            if(result.Succeeded)
                return Ok(new { message = $"Permission {model.Permission} added to {model.RoleName}" });

            return BadRequest(result.Errors);
        }

        [HttpGet("get-role-permissions/{roleName}")]
        [Authorize(Policy = Permissions.Roles.View)]
        public async Task<IActionResult> GetRolePermissions(string roleName)
        {
            var role = await _roleManager.FindByNameAsync(roleName);
            if (role == null) return NotFound("Role not found");

            // আইডেন্টিটি রোল থেকে ক্লেইমগুলো (Permissions) নিয়ে আসা
            var claims = await _roleManager.GetClaimsAsync(role);
            var permissions = claims.Select(c => c.Value).ToList();

            return Ok(permissions);
        }

        [HttpPost("remove-permission")]
        [Authorize(Policy = Permissions.Roles.Edit)]
        public async Task<IActionResult> RemovePermission([FromBody] RolePermissionDto model)
        {
            var role = await _roleManager.FindByNameAsync(model.RoleName);
            if (role == null) return NotFound("Role not found");

            var claims = await _roleManager.GetClaimsAsync(role);
            var claimToRemove = claims.FirstOrDefault(c => c.Value == model.Permission);

            if (claimToRemove != null)
            {
                var result = await _roleManager.RemoveClaimAsync(role, claimToRemove);
                if (result.Succeeded) return Ok(new { message = "Permission removed successfully" });
            }

            return BadRequest("Failed to remove permission or permission not found");
        }
        // ৪. সব রোলের লিস্ট দেখা
        [HttpGet("all-roles")]
        [Authorize(Policy = Permissions.Roles.View)]
        public IActionResult GetRoles() => Ok(_roleManager.Roles.ToList());
    }
}
