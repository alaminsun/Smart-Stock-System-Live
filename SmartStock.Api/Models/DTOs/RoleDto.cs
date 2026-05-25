namespace SmartStock.Api.Models.DTOs
{
    public class RoleDto
    {
        public class RoleCreateDto
        {
            public string RoleName { get; set; } = string.Empty;
        }

        public class UserRoleDto
        {
            public string Email { get; set; } = string.Empty;
            public string RoleName { get; set; } = string.Empty;
        }

        public class RolePermissionDto
        {
            public string RoleName { get; set; } = string.Empty;
            public string Permission { get; set; } = string.Empty;
            public bool IsSelected { get; set; }
        }

    }
}
