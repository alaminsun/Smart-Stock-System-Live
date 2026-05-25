import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';


import { authGuard } from './guards/auth-guard';
import { RegisterComponent } from './components/register/register.component';
import { permissionGuard } from './guards/permission.guard';
import { RoleManagementComponent } from './components/role-management/role-management.component';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { MenuManagementComponent } from './components/menu-management/menu-management.component';
import { CategoryManagementComponent } from './components/category-management/category-management.component';
import { ProductManagementComponent } from './components/product-management/product-management.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { StockInComponent } from './components/inventory/stock-in/stock-in.component';
import { SupplierManagementComponent } from './components/inventory/supplier-management/supplier-management.component';
import { CustomerManagementComponent } from './components/inventory/customer-managment/customer-management.component';
import { StockOutComponent } from './components/inventory/stock-out/stock-out.component';
import { InventoryHistoryComponent } from './components/inventory/inventory-history/inventory-history.component';
import { BillingComponent } from './components/billing/billing.component';
import { InvoiceHistoryComponent } from './components/billing/invoice-history/invoice-history.component';
import { ProfitLossComponent } from './components/reports/profit-loss/profit-loss.component';
import { ActivityLogComponent } from './components/reports/activity-log/activity-log.component';
import { ProfileComponent } from './components/profile/profile.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Dashboard.View' }
  },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard] },
  { path: 'products', 
    component: ProductManagementComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Products.View' }
  },
  // // { path: '', component: ProductListComponent }, // ডিফল্ট পেজ (লিস্ট)
  // { 
  //   path: 'add-product',
  //   component: ProductFormComponent,
  //   canActivate: [authGuard, permissionGuard], 
  //   data: { permission: 'Permissions.Products.Create' } 
  // }, // অ্যাড ফর্ম পেজ
  // { 
  //   path: 'edit-product/:id',
  //   component: ProductFormComponent,
  //   canActivate: [authGuard, permissionGuard],
  //   data: { permission: 'Permissions.Products.Edit' }
  // }, // অ্যাড ফর্ম পেজ
  // { 
  //   path: 'delete-product',
  //   component: ProductFormComponent,
  //   canActivate: [authGuard, permissionGuard],
  //   data: { permission: 'Permissions.Products.Delete' }
  // }, // অ্যাড ফর্ম পেজ
  { 
    path: 'suppliers', 
    component: SupplierManagementComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Suppliers.View' }
  },
    { 
    path: 'customers', 
    component: CustomerManagementComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Customers.View' }
  },
  { 
  path: 'roles', 
  component: RoleManagementComponent, 
  canActivate: [authGuard, permissionGuard],
  data: { permission: 'Permissions.Roles.View' }
  },
  { 
    path: 'users', 
    component: UserManagementComponent, 
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Users.View' }
  },
  { 
    path: 'menu-management',
    component: MenuManagementComponent,
    canActivate: [authGuard], 
  },
   { 
    path: 'audit-log',
    component: ActivityLogComponent,
    canActivate: [authGuard, permissionGuard], 
    data: { permission: 'Permissions.AuditLogs.View' }
  },
  { 
    path: 'categories',
    component: CategoryManagementComponent,
    canActivate: [authGuard, permissionGuard], 
    data: { permission: 'Permissions.Categories.View' }
  },

  { 
    path: 'inventory/stock-in',
    component: StockInComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Inventory.Manage' }
  }, 
  { 
    path: 'inventory/stock-out',
    component: StockOutComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Inventory.Manage' }
   }, 
  { 
    path: 'inventory/history',
    component: InventoryHistoryComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Inventory.View' }
  }, 
  { 
    path: 'billing',
    component: BillingComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Invoices.Create' } // Billing is usually for creating
  },
  { 
    path: 'invoice-history',
    component: InvoiceHistoryComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Invoices.View' }
  },
  { 
    path: 'profit-loss',
    component: ProfitLossComponent,
    canActivate: [authGuard, permissionGuard],
    data: { permission: 'Permissions.Reports.View' }
  },
    
  // Redirect to home or login if route not found
  { path: '**', redirectTo: '' }
];
