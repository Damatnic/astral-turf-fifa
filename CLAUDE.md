# CLAUDE CLI GROUND RULES - MANDATORY COMPLIANCE

You are working with a developer's production environment. Follow these rules EXACTLY. Every project must be enterprise-grade and immediately deployable.

## IMPLEMENTATION STANDARDS
- **NEVER use placeholders, TODOs, or "coming soon" labels**
- **ALL features must be fully implemented and functional**
- **Complete all code - no partial implementations**
- **Every function, component, and feature must work end-to-end**
- **No skeleton code, stub functions, or placeholder content**
- **Implement proper TypeScript types where applicable**
- **Add comprehensive JSDoc comments for all functions**
- **Follow consistent code formatting and style guidelines**

## SERVER AND PROCESS MANAGEMENT
- **NEVER kill all Node processes with `pkill node` or `killall node`**
- **Always use specific process management (PM2, process IDs, or port-specific kills)**
- **Launch each project on a UNIQUE port number (check 3000-9000 range)**
- **Check for port availability before starting servers**
- **Use environment-specific ports with proper fallbacks**
- **Never assume default ports are available**
- **Include graceful shutdown handling for all servers**
- **Implement proper process monitoring and restart policies**

## CRITICAL: Node.js Process Management
**DO NOT KILL NODE.JS PROCESSES WITHOUT EXPLICIT USER REQUEST**

- This project runs alongside multiple other projects
- Killing Node.js processes can break running applications
- Always check with user before terminating any processes
- Use `npm run dev` or similar commands to start development servers
- Let user manage process lifecycle unless specifically asked to intervene

## DATABASE AND DATA HANDLING
- **Always implement proper database connections with connection pooling**
- **Include full CRUD operations where needed**
- **Implement proper error handling for database operations**
- **Never use mock data unless explicitly requested for testing**
- **Include proper data validation and sanitization**
- **Add database migrations and seeding scripts**
- **Implement proper indexing strategies**
- **Handle database connection failures gracefully**
- **Add query optimization and performance monitoring**

## ERROR HANDLING AND VALIDATION
- **Implement comprehensive error handling in ALL code**
- **Add input validation for all user inputs (client AND server side)**
- **Include proper try-catch blocks with specific error types**
- **Handle edge cases and potential failures**
- **Log errors appropriately with structured logging**
- **Implement custom error classes for different error types**
- **Add error monitoring and alerting capabilities**
- **Include proper HTTP status codes for API responses**

## CONFIGURATION AND ENVIRONMENT
- **Create proper .env files with all required variables**
- **Include example .env.example files with placeholder values**
- **Never hardcode sensitive information**
- **Use proper configuration management with validation**
- **Include all necessary dependencies in package.json with exact versions**
- **Add environment-specific configuration files**
- **Implement configuration validation on startup**
- **Include development, staging, and production configurations**

## SECURITY IMPLEMENTATION
- **Implement proper authentication and authorization**
- **Add rate limiting to all public endpoints**
- **Include CORS configuration with specific origins**
- **Implement input sanitization and XSS protection**
- **Add HTTPS configuration for production**
- **Include security headers (helmet.js for Node.js)**
- **Implement proper session management**
- **Add API key management and rotation**
- **Include SQL injection prevention measures**
- **Add CSRF protection where applicable**

## TESTING AND QUALITY ASSURANCE
- **Code must be production-ready and thoroughly tested**
- **Include unit tests for all business logic**
- **Add integration tests for API endpoints**
- **Implement proper logging and monitoring**
- **Add health check endpoints**
- **Include performance monitoring and metrics**
- **Implement proper code linting and formatting**
- **Add pre-commit hooks for code quality**
- **Include load testing for high-traffic endpoints**

## FILE STRUCTURE AND ORGANIZATION
- **Create complete project structures following industry standards**
- **Include all necessary configuration files**
- **Organize code with proper separation of concerns (MVC, clean architecture)**
- **Include comprehensive README files with setup instructions**
- **Add proper .gitignore files for the tech stack**
- **Create proper folder structures (src/, tests/, docs/, config/)**
- **Include API documentation (OpenAPI/Swagger)**
- **Add changelog and version management**

## DEPENDENCY MANAGEMENT
- **Always check and install ALL required dependencies**
- **Include exact version numbers in package.json**
- **Test npm/yarn install before declaring complete**
- **Include dev dependencies needed for development**
- **Check for peer dependency warnings and resolve them**
- **Never assume global packages are installed**
- **Add dependency vulnerability scanning**
- **Include package-lock.json or yarn.lock files**

## API AND INTEGRATION STANDARDS
- **Always configure CORS properly for frontend-backend communication**
- **Test API endpoints before integration**
- **Handle different HTTP methods (GET, POST, PUT, DELETE, PATCH)**
- **Include proper request/response headers**
- **Test cross-origin requests if applicable**
- **Implement proper API versioning (/api/v1/)**
- **Add comprehensive API documentation**
- **Include request/response validation schemas**
- **Implement proper pagination for large datasets**
- **Add API response caching where appropriate**

## FRONTEND INTEGRATION (if applicable)
- **Ensure API URLs match between frontend and backend**
- **Handle loading states and error states in UI**
- **Implement proper form validation on both client and server**
- **Test responsive design on different screen sizes**
- **Handle browser compatibility issues**
- **Include proper meta tags and SEO basics**
- **Implement proper state management**
- **Add accessibility features (ARIA labels, semantic HTML)**
- **Include performance optimization (lazy loading, code splitting)**

## DEPLOYMENT READINESS
- **All projects must be immediately runnable**
- **Include proper build scripts and commands**
- **Add startup scripts and process management (PM2 configs)**
- **Include health checks and monitoring**
- **Prepare for production deployment with Docker if applicable**
- **Add CI/CD pipeline configurations**
- **Include environment-specific deployment scripts**
- **Add monitoring and alerting configurations**
- **Include backup and recovery procedures**

## ABSOLUTE PROHIBITIONS
❌ **NEVER use `pkill node`, `killall node`, or similar broad process kills**
❌ **NEVER leave TODO comments or unimplemented features**
❌ **NEVER use placeholder text like "Add your API key here" without proper setup**
❌ **NEVER assume services are running on default ports**
❌ **NEVER skip error handling or validation**
❌ **NEVER create incomplete or broken implementations**
❌ **NEVER ignore security best practices**
❌ **NEVER hardcode credentials or sensitive data**
❌ **NEVER assume dependencies are installed globally**
❌ **NEVER skip testing API endpoints before integration**
❌ **NEVER ignore CORS configuration**
❌ **NEVER use console.log as the only error handling**

## Development Commands
- Check package.json for available scripts
- Ask user for lint/typecheck commands if not found in package.json

## Testing
- Verify test framework before assuming testing approach
- Check README or search codebase for testing patterns

**CORE PRINCIPLE: If a user cannot successfully complete every intended workflow on their first attempt after following your setup instructions, the project is incomplete. No exceptions.**