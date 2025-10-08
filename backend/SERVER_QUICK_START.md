# Astral Turf Backend Server - Quick Start

## ✅ RECOMMENDED: Start Server via Batch File

**The simplest and most reliable way to run the server:**

1. Open Windows File Explorer
2. Navigate to: `C:\Users\damat\_REPOS\Astral Turf\backend`
3. Double-click `start-server.bat`

This will open a new Command Prompt window with the server running.

**OR** run from any command prompt:
```cmd
cd "C:\Users\damat\_REPOS\Astral Turf\backend"
start-server.bat
```

---

## Alternative: NPM Script (From Outside VS Code)

Open a regular PowerShell or Command Prompt (NOT VS Code's integrated terminal):

```powershell
cd "C:\Users\damat\_REPOS\Astral Turf\backend"
npm start
```

Or:

```powershell
cd "C:\Users\damat\_REPOS\Astral Turf\backend"
npm run start:simple
```

---

## Server Information

Once started, the server will be available at:

- **Base URL**: http://localhost:3000
- **API Base**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

### Example API Endpoints:

- POST http://localhost:3000/api/auth/register
- POST http://localhost:3000/api/auth/login
- GET http://localhost:3000/api/teams
- GET http://localhost:3000/api/players
- GET http://localhost:3000/api/formations
- GET http://localhost:3000/api/matches

---

## Testing the Server

### Quick Health Check (PowerShell):
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/health'
```

### Register a Test User:
```powershell
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method POST -ContentType 'application/json' -Body '{"email":"test@example.com","password":"Test123!@#","username":"testuser"}'
```

---

## Important Notes

⚠️ **VS Code Terminal Issue**: There's a known issue with Console Ninja extension interfering with Node.js servers in VS Code's integrated terminal. Always run the server using the batch file or from a standalone terminal.

📁 **Files**:
- `server-simple.js` - Express wrapper around NestJS (more reliable)
- `dist/main.js` - Original compiled NestJS entry point
- `start-server.bat` - Convenient batch file to launch server

🗄️ **Database**: Connected to Neon PostgreSQL (configured in `.env`)

---

## Stopping the Server

- If running via batch file: Press `Ctrl+C` in the command window
- If running via terminal: Press `Ctrl+C`

---

## Troubleshooting

### Port Already in Use

If you get "Port 3000 is already in use":

1. Find the process using the port:
```powershell
netstat -ano | findstr :3000
```

2. Kill it (replace PID with the actual process ID):
```powershell
taskkill /F /PID <PID>
```

### Can't Connect to Server

1. Make sure server is actually running (you should see startup messages)
2. Verify port 3000 is listening:
```powershell
netstat -ano | findstr :3000
```

3. Check Windows Firewall isn't blocking Node.js

---

## Development

For development with hot-reload (if needed):
```bash
npm run start:dev
```

Note: Use this only if you need TypeScript compilation on file changes. For testing, use the simple server.
