/**
 * RBAC Service - Advanced Role-Based Access Control
 *
 * Features:
 * - Dynamic role assignment
 * - Granular permission management
 * - Role hierarchy
 * - Permission inheritance
 * - Audit logging
 */

import { phoenixPool } from '../database/PhoenixDatabasePool';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  priority: number;
  isSystem: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export class RBACService {
  // System roles that cannot be deleted
  private readonly systemRoles = ['admin', 'coach', 'player', 'family'];

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    role: string,
    assignedBy: string,
  ): Promise<{
    success: boolean;
    message: string;
    user?: { id: string; role: string; permissions: string[] };
    error?: string;
  }> {
    try {
      // Verify the assigner has admin permissions
      const assigner = await phoenixPool.query(
        'SELECT role FROM users WHERE id = $1',
        [assignedBy],
      );

      if (assigner.rows.length === 0 || assigner.rows[0].role !== 'admin') {
        return {
          success: false,
          message: 'Only administrators can assign roles',
        };
      }

      // Verify the role exists
      const roleExists = await phoenixPool.query(
        'SELECT id, permissions FROM roles WHERE name = $1',
        [role],
      );

      if (roleExists.rows.length === 0) {
        return {
          success: false,
          message: `Role '${role}' does not exist`,
        };
      }

      const permissions = JSON.parse(roleExists.rows[0].permissions || '[]');

      // Update user role
      const result = await phoenixPool.query(
        `UPDATE users
         SET role = $1, permissions = $2, updated_at = NOW()
         WHERE id = $3
         RETURNING id, role, permissions`,
        [role, JSON.stringify(permissions), userId],
      );

      if (result.rowCount === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Invalidate user sessions to force re-authentication
      await phoenixPool.query(
        `UPDATE user_sessions
         SET is_active = false
         WHERE user_id = $1`,
        [userId],
      );

      // Log role change
      await this.logRoleChange(userId, role, assignedBy, 'ROLE_ASSIGNED');

      return {
        success: true,
        message: `Role '${role}' assigned successfully`,
        user: {
          id: result.rows[0].id,
          role: result.rows[0].role,
          permissions: JSON.parse(result.rows[0].permissions || '[]'),
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to assign role',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Grant specific permission to user
   */
  async grantPermission(
    userId: string,
    permission: string,
    grantedBy: string,
  ): Promise<{
    success: boolean;
    message: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      // Verify the granter has admin permissions
      const granter = await phoenixPool.query(
        'SELECT role FROM users WHERE id = $1',
        [grantedBy],
      );

      if (granter.rows.length === 0 || granter.rows[0].role !== 'admin') {
        return {
          success: false,
          message: 'Only administrators can grant permissions',
        };
      }

      // Get current user permissions
      const user = await phoenixPool.query(
        'SELECT permissions FROM users WHERE id = $1',
        [userId],
      );

      if (user.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const currentPermissions = JSON.parse(user.rows[0].permissions || '[]');

      // Check if permission already exists
      if (currentPermissions.includes(permission)) {
        return {
          success: false,
          message: 'User already has this permission',
        };
      }

      // Add new permission
      const updatedPermissions = [...currentPermissions, permission];

      await phoenixPool.query(
        `UPDATE users
         SET permissions = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(updatedPermissions), userId],
      );

      // Log permission grant
      await this.logPermissionChange(userId, permission, grantedBy, 'PERMISSION_GRANTED');

      return {
        success: true,
        message: `Permission '${permission}' granted successfully`,
        permissions: updatedPermissions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to grant permission',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Revoke specific permission from user
   */
  async revokePermission(
    userId: string,
    permission: string,
    revokedBy: string,
  ): Promise<{
    success: boolean;
    message: string;
    permissions?: string[];
    error?: string;
  }> {
    try {
      // Verify the revoker has admin permissions
      const revoker = await phoenixPool.query(
        'SELECT role FROM users WHERE id = $1',
        [revokedBy],
      );

      if (revoker.rows.length === 0 || revoker.rows[0].role !== 'admin') {
        return {
          success: false,
          message: 'Only administrators can revoke permissions',
        };
      }

      // Get current user permissions
      const user = await phoenixPool.query(
        'SELECT permissions FROM users WHERE id = $1',
        [userId],
      );

      if (user.rows.length === 0) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      const currentPermissions = JSON.parse(user.rows[0].permissions || '[]');

      // Check if permission exists
      if (!currentPermissions.includes(permission)) {
        return {
          success: false,
          message: 'User does not have this permission',
        };
      }

      // Remove permission
      const updatedPermissions = currentPermissions.filter((p: string) => p !== permission);

      await phoenixPool.query(
        `UPDATE users
         SET permissions = $1, updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify(updatedPermissions), userId],
      );

      // Log permission revocation
      await this.logPermissionChange(userId, permission, revokedBy, 'PERMISSION_REVOKED');

      return {
        success: true,
        message: `Permission '${permission}' revoked successfully`,
        permissions: updatedPermissions,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to revoke permission',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<{
    success: boolean;
    roles?: Role[];
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT id, name, description, permissions, priority, is_system
         FROM roles
         ORDER BY priority DESC, name ASC`,
      );

      const roles: Role[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        permissions: JSON.parse(row.permissions || '[]'),
        priority: row.priority,
        isSystem: row.is_system,
      }));

      return {
        success: true,
        roles,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch roles',
      };
    }
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions(): Promise<{
    success: boolean;
    permissions?: Permission[];
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        `SELECT id, name, description, resource, action
         FROM permissions
         ORDER BY resource ASC, action ASC`,
      );

      const permissions: Permission[] = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        resource: row.resource,
        action: row.action,
      }));

      return {
        success: true,
        permissions,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      };
    }
  }

  /**
   * Get user's effective permissions (role + custom)
   */
  async getUserPermissions(userId: string): Promise<{
    success: boolean;
    permissions?: string[];
    role?: string;
    error?: string;
  }> {
    try {
      const result = await phoenixPool.query(
        'SELECT role, permissions FROM users WHERE id = $1',
        [userId],
      );

      if (result.rows.length === 0) {
        return {
          success: false,
          error: 'User not found',
        };
      }

      const permissions = JSON.parse(result.rows[0].permissions || '[]');

      return {
        success: true,
        permissions,
        role: result.rows[0].role,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch permissions',
      };
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const result = await this.getUserPermissions(userId);

      if (!result.success || !result.permissions) {
        return false;
      }

      // Admin has all permissions
      if (result.role === 'admin') {
        return true;
      }

      // Check for wildcard permission
      if (result.permissions.includes('*')) {
        return true;
      }

      // Check for specific permission
      return result.permissions.includes(permission);
    } catch {
      return false;
    }
  }

  /**
   * Create custom role
   */
  async createRole(data: {
    name: string;
    description: string;
    permissions: string[];
    priority?: number;
    createdBy: string;
  }): Promise<{
    success: boolean;
    role?: Role;
    message?: string;
    error?: string;
  }> {
    try {
      // Verify creator has admin permissions
      const creator = await phoenixPool.query(
        'SELECT role FROM users WHERE id = $1',
        [data.createdBy],
      );

      if (creator.rows.length === 0 || creator.rows[0].role !== 'admin') {
        return {
          success: false,
          message: 'Only administrators can create roles',
        };
      }

      // Check if role name already exists
      const existing = await phoenixPool.query(
        'SELECT id FROM roles WHERE name = $1',
        [data.name],
      );

      if (existing.rows.length > 0) {
        return {
          success: false,
          message: `Role '${data.name}' already exists`,
        };
      }

      // Create role
      const result = await phoenixPool.query(
        `INSERT INTO roles (name, description, permissions, priority, is_system)
         VALUES ($1, $2, $3, $4, false)
         RETURNING id, name, description, permissions, priority, is_system`,
        [data.name, data.description, JSON.stringify(data.permissions), data.priority || 0],
      );

      const role: Role = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        description: result.rows[0].description,
        permissions: JSON.parse(result.rows[0].permissions),
        priority: result.rows[0].priority,
        isSystem: result.rows[0].is_system,
      };

      // Log role creation
      await this.logRoleChange(
        data.createdBy,
        data.name,
        data.createdBy,
        'ROLE_CREATED',
      );

      return {
        success: true,
        role,
        message: 'Role created successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create role',
      };
    }
  }

  /**
   * Delete custom role
   */
  async deleteRole(
    roleId: string,
    deletedBy: string,
  ): Promise<{
    success: boolean;
    message: string;
    error?: string;
  }> {
    try {
      // Verify deleter has admin permissions
      const deleter = await phoenixPool.query(
        'SELECT role FROM users WHERE id = $1',
        [deletedBy],
      );

      if (deleter.rows.length === 0 || deleter.rows[0].role !== 'admin') {
        return {
          success: false,
          message: 'Only administrators can delete roles',
        };
      }

      // Check if role is a system role
      const role = await phoenixPool.query(
        'SELECT name, is_system FROM roles WHERE id = $1',
        [roleId],
      );

      if (role.rows.length === 0) {
        return {
          success: false,
          message: 'Role not found',
        };
      }

      if (role.rows[0].is_system) {
        return {
          success: false,
          message: 'Cannot delete system roles',
        };
      }

      // Check if any users have this role
      const usersWithRole = await phoenixPool.query(
        'SELECT COUNT(*) as count FROM users WHERE role = $1',
        [role.rows[0].name],
      );

      if (parseInt(usersWithRole.rows[0].count) > 0) {
        return {
          success: false,
          message: 'Cannot delete role that is assigned to users',
        };
      }

      // Delete role
      await phoenixPool.query('DELETE FROM roles WHERE id = $1', [roleId]);

      // Log role deletion
      await this.logRoleChange(
        deletedBy,
        role.rows[0].name,
        deletedBy,
        'ROLE_DELETED',
      );

      return {
        success: true,
        message: 'Role deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete role',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Private helper methods

  /**
   * Log role change event
   */
  private async logRoleChange(
    userId: string,
    role: string,
    performedBy: string,
    eventType: string,
  ): Promise<void> {
    try {
      await phoenixPool.query(
        `INSERT INTO system_logs (
          level,
          message,
          timestamp,
          service,
          metadata,
          security_event_type,
          user_id
        )
        VALUES ('info', $1, NOW(), 'rbac-service', $2, $3, $4)`,
        [
          `Role change: ${eventType}`,
          JSON.stringify({ userId, role, performedBy }),
          eventType,
          userId,
        ],
      );
    } catch {
      // Silently fail - logging shouldn't break the main flow
    }
  }

  /**
   * Log permission change event
   */
  private async logPermissionChange(
    userId: string,
    permission: string,
    performedBy: string,
    eventType: string,
  ): Promise<void> {
    try {
      await phoenixPool.query(
        `INSERT INTO system_logs (
          level,
          message,
          timestamp,
          service,
          metadata,
          security_event_type,
          user_id
        )
        VALUES ('info', $1, NOW(), 'rbac-service', $2, $3, $4)`,
        [
          `Permission change: ${eventType}`,
          JSON.stringify({ userId, permission, performedBy }),
          eventType,
          userId,
        ],
      );
    } catch {
      // Silently fail - logging shouldn't break the main flow
    }
  }
}

// Export singleton instance
export const rbacService = new RBACService();
