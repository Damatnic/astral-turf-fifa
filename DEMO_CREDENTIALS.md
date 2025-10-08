# Demo User Credentials

## 🎉 Demo Users Created Successfully!

The database has been seeded with the following demo accounts for testing:

### 1. Coach Account
- **Email**: `coach@astralfc.com`
- **Password**: `password123`
- **Name**: Mike Anderson
- **Role**: Coach

### 2. Player Account
- **Email**: `player1@astralfc.com`
- **Password**: `password123`
- **Name**: Alex Hunter
- **Role**: Player

### 3. Family Member Account
- **Email**: `linda.smith@astralfc.com`
- **Password**: `password123`
- **Name**: Linda Smith
- **Role**: Family

## 🚀 How to Test Login

1. **Navigate to**: http://localhost:5173
2. **Login Page**: The form is pre-filled with coach credentials
3. **Quick Login**: Click any of the role-based login buttons (Coach/Player/Family)
4. **Manual Login**: Enter email and password, then click Login

## ✅ What's Working

- ✅ Backend API on port 5555
- ✅ Frontend UI on port 5173
- ✅ Database connected (Neon PostgreSQL)
- ✅ 3 demo users seeded
- ✅ JWT authentication ready
- ✅ Login page configured

## 🔐 Security Notes

- All demo accounts use the same password: `password123`
- Email verification is pre-verified for all accounts
- All accounts are active by default
- Passwords are hashed with bcrypt (salt rounds: 10)

## 📝 Next Steps

After successful login, you should:
1. Be redirected to `/dashboard`
2. See your user info in the app
3. Be able to access protected routes
4. See JWT token stored in localStorage

## 🛠️ Troubleshooting

If login fails:
1. Check that backend is running: http://localhost:5555/api/health
2. Check browser console for errors
3. Verify Network tab shows API request to `/auth/login`
4. Check that CORS is enabled for localhost:5173

## 🎯 Demo Workflow

**As Coach**:
- View all players
- Create formations
- Schedule matches
- Manage team tactics

**As Player**:
- View your profile
- See assigned formations
- Check match schedule
- Track performance

**As Family Member**:
- View linked player profiles
- Check player schedules
- Receive notifications
- Access payment portal
