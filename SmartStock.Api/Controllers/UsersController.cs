using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Models;
using Microsoft.AspNetCore.Authorization;
using SmartStock.Api.Constants;
using SmartStock.Api.Interfaces;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // শুধুমাত্র লগইন করা ইউজার এক্সেস করতে পারবে
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // ১. সব ইউজারের লিস্ট রোলসহ আনা
        [HttpGet("all-users")]
        [Authorize(Policy = Permissions.Users.View)]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _userRepository.GetAllAsync();
            var userListWithRoles = new List<object>();

            foreach (var user in users)
            {
                var roles = await _userRepository.GetRolesAsync(user);
                userListWithRoles.Add(new
                {
                    id = user.Id,
                    fullName = user.FullName,
                    email = user.Email,
                    companyName = user.CompanyName,
                    role = roles.FirstOrDefault()
                });
            }

            return Ok(userListWithRoles);
        }

        // ২. নির্দিষ্ট ইউজারের ডাটা আনা
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(string id)
        {
            // নিজেকে দেখা অথবা এডমিন পারমিশন থাকা
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (id != currentUserId && !User.HasClaim("Permission", Permissions.Users.View))
            {
                return Forbid();
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound("User not found");

            var roles = await _userRepository.GetRolesAsync(user);
            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                companyName = user.CompanyName,
                phoneNumber = user.PhoneNumber,
                address = user.Address,
                profilePicture = user.ProfilePicture,
                role = roles.FirstOrDefault()
            });
        }

        // ৩. ইউজার আপডেট করা
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(string id, [FromBody] SmartStock.Api.Models.DTOs.UserUpdateDto model)
        {
            // নিজেকে আপডেট করা অথবা এডমিন পারমিশন থাকা
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (id != currentUserId && !User.HasClaim("Permission", Permissions.Users.Edit))
            {
                return Forbid();
            }

            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound("User not found");

            user.FullName = model.FullName;
            user.PhoneNumber = model.PhoneNumber;
            user.Address = model.Address;
            user.CompanyName = model.CompanyName;
            user.ProfilePicture = model.ProfilePicture;

            // ইমেইল আপডেট করলে ইউজারনেমও আপডেট করতে হবে
            if (user.Email != model.Email)
            {
                user.Email = model.Email;
                user.UserName = model.Email;
            }

            var result = await _userRepository.UpdateAsync(user);
            if (!result.Succeeded) return BadRequest(result.Errors);

            // রোল আপডেট করার লজিক (শুধুমাত্র যদি এডমিন পারমিশন থাকে)
            if (!string.IsNullOrEmpty(model.Role) && User.HasClaim("Permission", Permissions.Users.Edit))
            {
                var currentRoles = await _userRepository.GetRolesAsync(user);
                await _userRepository.RemoveFromRolesAsync(user, currentRoles);
                await _userRepository.AddToRoleAsync(user, model.Role);
            }

            return Ok(new { message = "User updated successfully" });
        }

        // ৪. ইউজার ডিলিট করা
        [HttpDelete("{id}")]
        [Authorize(Policy = Permissions.Users.Delete)]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _userRepository.GetByIdAsync(id);
            if (user == null) return NotFound("User not found");

            // নিজেকে ডিলিট করা থেকে বিরত রাখার লজিক (নিরাপত্তার জন্য)
            var currentUserEmail = User.Identity?.Name;
            if (user.Email == currentUserEmail) return BadRequest("You cannot delete yourself!");

            var result = await _userRepository.DeleteAsync(user);
            if (result.Succeeded) return Ok(new { message = "User deleted successfully" });

            return BadRequest(result.Errors);
        }
    }
}