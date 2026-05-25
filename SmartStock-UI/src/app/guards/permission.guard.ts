import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const permissionGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  

  // 1. Get the required permission name from the route
  const requiredPermission = route.data['permission'] as string;

  // 2. If no permission is required, allow access
  if (!requiredPermission) {
    return true;
  }

  // 3. Check for permission using AuthService signal
  console.log('Checking permission:', requiredPermission);
  console.log('User permissions:', authService.userPermissions());

  if (authService.hasPermission(requiredPermission)) {
    return true;
  }

  // 4. If permission is missing, redirect to home or access denied page
  console.error('Access Denied: Missing permission', requiredPermission);
  alert('You do not have permission to access this page!');
  //router.navigate(['/']); 
  return false;
};