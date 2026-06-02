using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartStock.Api.Interfaces;
using SmartStock.Api.Models;

namespace SmartStock.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenusController : ControllerBase
    {
        private readonly IRepository<NavigationMenu> _menuRepository;

        public MenusController(IRepository<NavigationMenu> menuRepository)
        {
            _menuRepository = menuRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenus()
        {
            try
            {
                var allMenus = (await _menuRepository.GetAllAsync())
                    .OrderBy(m => m.DisplayOrder)
                    .ToList();

                // ম্যাপ ব্যবহার করে দ্রুত ট্রি তৈরি করা
                var menuTree = allMenus
                    .Where(m => m.ParentId == null)
                    .Select(m => new {
                        m.Id,
                        m.Title,
                        m.Icon,
                        m.Link,
                        m.Permission,
                        m.ParentId,
                        m.DisplayOrder,
                        Children = GetChildren(allMenus, m.Id, 0)
                    }).ToList();

                return Ok(menuTree);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        private List<object> GetChildren(List<NavigationMenu> allMenus, int parentId, int depth)
        {
            // ইনফিনিট লুপ এড়াতে ৫ লেভেলের বেশি পার্স করা হবে না
            if (depth > 5) return new List<object>();

            return allMenus
                .Where(m => m.ParentId == parentId && m.Id != parentId) // নিজের প্যারেন্ট নিজে হওয়া যাবে না
                .OrderBy(m => m.DisplayOrder)
                .Select(m => new {
                    m.Id,
                    m.Title,
                    m.Icon,
                    m.Link,
                    m.Permission,
                    m.ParentId,
                    m.DisplayOrder,
                    Children = GetChildren(allMenus, m.Id, depth + 1)
                }).Cast<object>().ToList();
        }

        [HttpPost]
        public async Task<IActionResult> CreateMenu(NavigationMenu menu)
        {
            var created = await _menuRepository.AddAsync(menu);
            await _menuRepository.SaveChangesAsync();
            return Ok(created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMenu(int id, [FromBody] NavigationMenu menu)
        {
            if (id != menu.Id) return BadRequest();

            var existingMenu = await _menuRepository.GetByIdAsync(id);
            if (existingMenu == null) return NotFound();

            existingMenu.Title = menu.Title;
            existingMenu.Icon = menu.Icon;
            existingMenu.Link = menu.Link;
            existingMenu.Permission = menu.Permission;
            existingMenu.ParentId = menu.ParentId;
            existingMenu.DisplayOrder = menu.DisplayOrder;

            await _menuRepository.UpdateAsync(existingMenu);
            await _menuRepository.SaveChangesAsync();

            return Ok(existingMenu);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenu(int id)
        {
            var menu = await _menuRepository.GetByIdAsync(id);
            if (menu == null) return NotFound();

            // Check if this menu has children
            var hasChildren = await _menuRepository.ExistsAsync(m => m.ParentId == id);
            if (hasChildren)
            {
                return BadRequest("এই মেনুর অধীনে সাব-মেনু আছে। আগে সাব-মেনুগুলো ডিলিট করুন।");
            }

            await _menuRepository.DeleteAsync(menu);
            await _menuRepository.SaveChangesAsync();
            return Ok();
        }

        [HttpGet("parents")]
        public async Task<IActionResult> GetParentMenus()
        {
            var parents = (await _menuRepository.FindAsync(m => m.Link == null || m.Link == ""))
                .Select(m => new { m.Id, m.Title });
            return Ok(parents);
        }
    }
}
