-- ===========================================
-- Phoenix API Authentication Complete Migration
-- Version: 005
-- Date: January 2025
-- Description: Adds OAuth, MFA, Session Management, and RBAC support
-- ===========================================

-- ===========================================
-- 1. OAuth Accounts Table
-- ===========================================
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  provider_account_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  token_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_provider ON oauth_accounts(provider);
CREATE INDEX IF NOT EXISTS idx_oauth_created ON oauth_accounts(created_at);

COMMENT ON TABLE oauth_accounts IS 'Stores linked OAuth provider accounts for users';
COMMENT ON COLUMN oauth_accounts.provider IS 'OAuth provider name: google, github, microsoft, facebook';
COMMENT ON COLUMN oauth_accounts.provider_account_id IS 'User ID from the OAuth provider';
COMMENT ON COLUMN oauth_accounts.expires_at IS 'Unix timestamp (milliseconds) when access token expires';

-- ===========================================
-- 2. MFA Tables
-- ===========================================

-- Add MFA columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(255),
  ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT;

COMMENT ON COLUMN users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN users.mfa_secret IS 'Base32-encoded TOTP secret for MFA';
COMMENT ON COLUMN users.mfa_backup_codes IS 'JSON array of hashed backup codes';

-- MFA setup (temporary data during setup)
CREATE TABLE IF NOT EXISTS mfa_setups (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  secret VARCHAR(255) NOT NULL,
  backup_codes TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mfa_setup_user ON mfa_setups(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_setup_expiry ON mfa_setups(expires_at);

COMMENT ON TABLE mfa_setups IS 'Temporary storage for MFA setup data (expires after 15 minutes)';
COMMENT ON COLUMN mfa_setups.expires_at IS 'Unix timestamp (milliseconds) when setup expires';

-- MFA verification attempts (rate limiting)
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
  attempt_time TIMESTAMP DEFAULT NOW(),
  success BOOLEAN DEFAULT false,
  ip_address VARCHAR(45),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_mfa_attempts ON mfa_verification_attempts(user_id, attempt_time);
CREATE INDEX IF NOT EXISTS idx_mfa_attempts_time ON mfa_verification_attempts(attempt_time);

COMMENT ON TABLE mfa_verification_attempts IS 'Tracks MFA verification attempts for rate limiting (5 per 15 min)';

-- ===========================================
-- 3. Session Management Tables
-- ===========================================

-- Enhance user_sessions table
ALTER TABLE user_sessions
  ADD COLUMN IF NOT EXISTS device_fingerprint VARCHAR(64),
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
  ADD COLUMN IF NOT EXISTS location VARCHAR(255),
  ADD COLUMN IF NOT EXISTS browser VARCHAR(100),
  ADD COLUMN IF NOT EXISTS os VARCHAR(100),
  ADD COLUMN IF NOT EXISTS platform VARCHAR(50),
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_sessions_fingerprint ON user_sessions(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_sessions_activity ON user_sessions(last_activity);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_ip ON user_sessions(ip_address);

COMMENT ON COLUMN user_sessions.device_fingerprint IS 'SHA-256 hash of user agent + IP address';
COMMENT ON COLUMN user_sessions.user_agent IS 'Full user agent string from browser';
COMMENT ON COLUMN user_sessions.location IS 'Geographic location from IP (City, State, Country)';
COMMENT ON COLUMN user_sessions.browser IS 'Parsed browser name and version';
COMMENT ON COLUMN user_sessions.os IS 'Parsed operating system name and version';
COMMENT ON COLUMN user_sessions.platform IS 'Device platform: desktop, mobile, tablet';
COMMENT ON COLUMN user_sessions.last_activity IS 'Last request timestamp for this session';

-- ===========================================
-- 4. RBAC Tables
-- ===========================================

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions TEXT NOT NULL,
  priority INT DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_priority ON roles(priority DESC);
CREATE INDEX IF NOT EXISTS idx_roles_system ON roles(is_system);

COMMENT ON TABLE roles IS 'User roles with associated permissions';
COMMENT ON COLUMN roles.permissions IS 'JSON array of permission strings';
COMMENT ON COLUMN roles.priority IS 'Role priority (higher = more privileged)';
COMMENT ON COLUMN roles.is_system IS 'Whether this is a built-in system role (cannot be deleted)';

-- Insert system roles
INSERT INTO roles (name, description, permissions, priority, is_system)
VALUES 
  ('super_admin', 'Super Administrator with all permissions', '["*"]', 1000, true),
  ('admin', 'Administrator with full system access', '["users:read","users:write","users:delete","teams:read","teams:write","teams:delete","analytics:read","analytics:write","system:configure","roles:manage"]', 900, true),
  ('manager', 'Team Manager with team and player management', '["teams:read","teams:write","players:read","players:write","analytics:read"]', 500, true),
  ('coach', 'Coach with read access and drill management', '["teams:read","players:read","analytics:read","drills:read","drills:write"]', 300, true),
  ('player', 'Player with personal profile access', '["profile:read","profile:write","stats:read","teams:read"]', 100, true)
ON CONFLICT (name) DO NOTHING;

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON permissions(action);

COMMENT ON TABLE permissions IS 'Available permissions in the system';
COMMENT ON COLUMN permissions.name IS 'Permission name in format: resource:action';
COMMENT ON COLUMN permissions.resource IS 'Resource being accessed (users, teams, analytics, etc.)';
COMMENT ON COLUMN permissions.action IS 'Action being performed (read, write, delete, etc.)';

-- Insert base permissions
INSERT INTO permissions (name, description, resource, action)
VALUES
  ('users:read', 'Read user data', 'users', 'read'),
  ('users:write', 'Create/update user data', 'users', 'write'),
  ('users:delete', 'Delete users', 'users', 'delete'),
  ('teams:read', 'Read team data', 'teams', 'read'),
  ('teams:write', 'Create/update teams', 'teams', 'write'),
  ('teams:delete', 'Delete teams', 'teams', 'delete'),
  ('analytics:read', 'View analytics', 'analytics', 'read'),
  ('analytics:write', 'Create/update analytics', 'analytics', 'write'),
  ('system:configure', 'Configure system settings', 'system', 'configure'),
  ('roles:manage', 'Manage roles and permissions', 'roles', 'manage'),
  ('players:read', 'Read player data', 'players', 'read'),
  ('players:write', 'Create/update player data', 'players', 'write'),
  ('drills:read', 'Read drills', 'drills', 'read'),
  ('drills:write', 'Create/update drills', 'drills', 'write'),
  ('profile:read', 'Read own profile', 'profile', 'read'),
  ('profile:write', 'Update own profile', 'profile', 'write'),
  ('stats:read', 'Read statistics', 'stats', 'read')
ON CONFLICT (name) DO NOTHING;

-- Add permissions column to users if not exists
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS permissions TEXT DEFAULT '[]';

COMMENT ON COLUMN users.permissions IS 'JSON array of additional permissions beyond role permissions';

-- System logs for audit trail
CREATE TABLE IF NOT EXISTS system_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  user_id VARCHAR(255),
  metadata TEXT,
  ip_address VARCHAR(45),
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_action ON system_logs(action, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_user ON system_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_resource ON system_logs(resource, timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON system_logs(timestamp DESC);

COMMENT ON TABLE system_logs IS 'Audit trail for RBAC and security events';
COMMENT ON COLUMN system_logs.action IS 'Action performed (assign_role, grant_permission, etc.)';
COMMENT ON COLUMN system_logs.metadata IS 'JSON object with additional context';

-- ===========================================
-- 5. Cleanup Function
-- ===========================================

-- Function to cleanup expired sessions and MFA setups
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
  -- Delete expired MFA setups
  DELETE FROM mfa_setups WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000;
  
  -- Delete old MFA verification attempts (older than 24 hours)
  DELETE FROM mfa_verification_attempts 
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
  
  -- Delete expired sessions
  DELETE FROM user_sessions WHERE expires_at < NOW();
  
  -- Log cleanup action
  INSERT INTO system_logs (action, resource, metadata)
  VALUES ('cleanup_expired_data', 'auth_tables', 
    json_build_object(
      'mfa_setups_deleted', (SELECT COUNT(*) FROM mfa_setups WHERE expires_at < EXTRACT(EPOCH FROM NOW()) * 1000),
      'mfa_attempts_deleted', (SELECT COUNT(*) FROM mfa_verification_attempts WHERE attempt_time < NOW() - INTERVAL '24 hours'),
      'sessions_deleted', (SELECT COUNT(*) FROM user_sessions WHERE expires_at < NOW())
    )::TEXT
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_auth_data IS 'Cleanup expired MFA setups, old verification attempts, and expired sessions';

-- ===========================================
-- 6. Update Triggers
-- ===========================================

-- Update oauth_accounts updated_at timestamp
CREATE OR REPLACE FUNCTION update_oauth_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER oauth_accounts_updated_at
BEFORE UPDATE ON oauth_accounts
FOR EACH ROW
EXECUTE FUNCTION update_oauth_accounts_updated_at();

-- Update roles updated_at timestamp
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_roles_updated_at();

-- ===========================================
-- 7. Verification Queries
-- ===========================================

-- Verify all tables exist
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('oauth_accounts', 'mfa_setups', 'mfa_verification_attempts', 'roles', 'permissions', 'system_logs');
  
  IF table_count = 6 THEN
    RAISE NOTICE 'SUCCESS: All 6 new tables created successfully';
  ELSE
    RAISE WARNING 'WARNING: Expected 6 tables, found %', table_count;
  END IF;
END $$;

-- Verify system roles exist
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM roles WHERE is_system = true;
  
  IF role_count = 5 THEN
    RAISE NOTICE 'SUCCESS: All 5 system roles created successfully';
  ELSE
    RAISE WARNING 'WARNING: Expected 5 system roles, found %', role_count;
  END IF;
END $$;

-- Verify permissions exist
DO $$
DECLARE
  permission_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO permission_count FROM permissions;
  
  IF permission_count >= 17 THEN
    RAISE NOTICE 'SUCCESS: All % permissions created successfully', permission_count;
  ELSE
    RAISE WARNING 'WARNING: Expected at least 17 permissions, found %', permission_count;
  END IF;
END $$;

-- Display migration summary
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Phoenix Authentication Migration Complete';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - oauth_accounts';
  RAISE NOTICE '  - mfa_setups';
  RAISE NOTICE '  - mfa_verification_attempts';
  RAISE NOTICE '  - roles (with 5 system roles)';
  RAISE NOTICE '  - permissions (with 17 base permissions)';
  RAISE NOTICE '  - system_logs';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Modified:';
  RAISE NOTICE '  - users (added mfa_enabled, mfa_secret, mfa_backup_codes, permissions)';
  RAISE NOTICE '  - user_sessions (added device tracking columns)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  - cleanup_expired_auth_data()';
  RAISE NOTICE '  - update_oauth_accounts_updated_at()';
  RAISE NOTICE '  - update_roles_updated_at()';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Configure OAuth providers in .env';
  RAISE NOTICE '  2. Run: SELECT cleanup_expired_auth_data(); (test cleanup)';
  RAISE NOTICE '  3. Optional: Schedule cleanup with pg_cron or external scheduler';
  RAISE NOTICE '===========================================';
END $$;
