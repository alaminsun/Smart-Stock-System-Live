using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SmartStock.Api.Models;
using SmartStock.Api.Models.DTOs;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IConfiguration _configuration;

        public AuthController(RoleManager<IdentityRole> roleManager, UserManager<ApplicationUser> userManager, IConfiguration configuration)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto model)
        {
            // যদি ইউজারনেম না দেয়, তবে ইমেইল-কেই ইউজারনেম হিসেবে ব্যবহার করা হবে
            string finalUsername = string.IsNullOrWhiteSpace(model.Username) ? model.Email : model.Username;

            // ইউজারনেম অলরেডি আছে কি না চেক করা
            var existingUser = await _userManager.FindByNameAsync(finalUsername);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Username is already taken" });
            }

            // ইমেইল চেক করা
            var existingEmail = await _userManager.FindByEmailAsync(model.Email);
            if (existingEmail != null)
            {
                return BadRequest(new { message = "Email is already registered" });
            }

            var user = new ApplicationUser
            {
                UserName = finalUsername,
                Email = model.Email,
                FullName = model.FullName,
                CompanyName = model.CompanyName
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                return Ok(new { message = "User registered successfully! Please wait for admin approval." });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto model)
        {
            // প্রথমে ইমেইল দিয়ে সার্চ করা
            var user = await _userManager.FindByEmailAsync(model.UsernameOrEmail);
            
            // ইমেইল দিয়ে না পাওয়া গেলে ইউজারনেম দিয়ে সার্চ করা
            if (user == null)
            {
                user = await _userManager.FindByNameAsync(model.UsernameOrEmail);
            }
            
            // ইউজার আছে কি না এবং পাসওয়ার্ড মিলছে কি না চেক করা
            if (user != null && await _userManager.CheckPasswordAsync(user, model.Password))
            {
                // ইউজারের রোলগুলো এখানেই নিয়ে নিন
                var userRoles = await _userManager.GetRolesAsync(user);

                // টোকেন জেনারেট করার সময় রোলগুলো পাস করে দিন
                var token = await GenerateJwtToken(user, userRoles);

                return Ok(new { token = token, message = "Login Successful" });
            }

            return Unauthorized("Invalid Username/Email or Password");
        }

        private async Task<string> GenerateJwtToken(ApplicationUser user, IList<string> roles)
        {
            // প্রাথমিক Claims লিস্ট তৈরি (List ব্যবহার করলে পরে Add করা সহজ হয়)
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim("FullName", user.FullName),
                new Claim("ProfilePicture", user.ProfilePicture ?? ""),
                new Claim(ClaimTypes.NameIdentifier, user.Id)
            };

            // প্রতিটি রোলকে টোকেনের Claims-এ যোগ করুন
            foreach (var roleName in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, roleName));

                var role = await _roleManager.FindByNameAsync(roleName);
                if (role != null)
                {
                    var roleClaims = await _roleManager.GetClaimsAsync(role); // রোলের পারমিশনগুলো আনুন
                    foreach (var roleClaim in roleClaims)
                    {
                        claims.Add(roleClaim); // টোকেনে পারমিশন ক্লেইম যোগ করা
                    }
                }
            }
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(3), // ৩ ঘণ্টা পর টোকেন এক্সপায়ার হবে
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto model)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                         ?? User.FindFirstValue(JwtRegisteredClaimNames.Sub);

            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null) 
            {
                // Fallback search by email if ID claim is mapped differently
                user = await _userManager.FindByEmailAsync(userId);
                if (user == null) return NotFound("User not found");
            }

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (result.Succeeded)
            {
                return Ok(new { message = "Password changed successfully!" });
            }

            return BadRequest(result.Errors);
        }
    }
}
