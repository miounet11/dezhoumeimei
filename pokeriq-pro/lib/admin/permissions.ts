/**
 * Admin Permission Management System
 * Handles role-based access control for admin functions
 */

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN' | 'CONTENT_ADMIN';
export type Permission = 
  | 'VIEW_DASHBOARD'
  | 'MANAGE_COURSES' 
  | 'MANAGE_ASSESSMENTS'
  | 'MANAGE_MEDIA'
  | 'MANAGE_USERS'
  | 'MANAGE_CHARACTERS'
  | 'VIEW_ANALYTICS'
  | 'SYSTEM_CONFIG';

// Role-based permission mapping
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  CONTENT_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_COURSES',
    'MANAGE_ASSESSMENTS',
    'MANAGE_MEDIA',
    'MANAGE_CHARACTERS',
    'VIEW_ANALYTICS'
  ],
  ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_COURSES',
    'MANAGE_ASSESSMENTS',
    'MANAGE_MEDIA',
    'MANAGE_USERS',
    'MANAGE_CHARACTERS',
    'VIEW_ANALYTICS'
  ],
  SUPER_ADMIN: [
    'VIEW_DASHBOARD',
    'MANAGE_COURSES',
    'MANAGE_ASSESSMENTS',
    'MANAGE_MEDIA',
    'MANAGE_USERS',
    'MANAGE_CHARACTERS',
    'VIEW_ANALYTICS',
    'SYSTEM_CONFIG'
  ]
};

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions?: Permission[];
}

/**
 * Check if user has required permission
 */
export function hasPermission(user: AdminUser, permission: Permission): boolean {
  // Check custom permissions first
  if (user.permissions) {
    return user.permissions.includes(permission);
  }

  // Fall back to role-based permissions
  const rolePermissions = ROLE_PERMISSIONS[user.role];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(user: AdminUser, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all required permissions
 */
export function hasAllPermissions(user: AdminUser, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user
 */
export function getUserPermissions(user: AdminUser): Permission[] {
  if (user.permissions) {
    return user.permissions;
  }
  return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: string): boolean {
  return ['ADMIN', 'SUPER_ADMIN', 'CONTENT_ADMIN'].includes(userRole);
}

/**
 * Middleware helper to check admin permissions
 */
export function requirePermission(permission: Permission) {
  return (user: AdminUser | null): boolean => {
    if (!user) return false;
    return hasPermission(user, permission);
  };
}

/**
 * Get user from demo data (for development)
 */
export function getDemoAdminUser(): AdminUser {
  return {
    id: 'demo-admin-id',
    email: 'admin@pokeriq.pro',
    name: 'Admin User',
    role: 'SUPER_ADMIN'
  };
}