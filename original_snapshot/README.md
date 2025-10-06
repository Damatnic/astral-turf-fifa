# Astral Turf v1.0 - Football Manager Tactics Board

A sophisticated football management application with an advanced tactics board, player management, and team strategy tools.

## Version 1.0 Features

- **Complete Rebranding**: Updated from "Astral Striker" to "Astral Turf"
- **Enhanced UI**: Modern visual improvements with better styling
- **New App Icon**: Updated branding with spooky soccer theme
- **Fixed Naming**: All references properly updated throughout the codebase
- **Improved Documentation**: Comprehensive setup and usage guides

## Features

- **Interactive Tactics Board**: Drag-and-drop player positioning with real-time formation management
- **Player Management**: Comprehensive player database with chemistry tracking
- **Formation System**: Multiple formations with custom positioning modes
- **AI Integration**: AI-powered tactical suggestions and analysis
- **Team Chemistry**: Visual chemistry links between players
- **Training & Development**: Youth academy and player development systems
- **Match Simulation**: Complete match simulation with detailed statistics
- **Financial Management**: Budget tracking and transfer market
- **Multi-language Support**: Built for international football management

## Prerequisites

Before running Astral Turf, make sure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** (comes with Node.js)
- **Git** (optional, for version control)

### Installing Node.js

1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS version for your operating system
3. Run the installer and follow the setup wizard
4. Verify installation by opening a terminal/command prompt and running:
   ```bash
   node --version
   npm --version
   ```

## Installation

1. **Extract the Project**
   - Extract the "Astral Turf" folder to your desired location
   - Open a terminal/command prompt in the extracted folder

2. **Install Dependencies**
   ```bash
   npm install
   ```
   This will download all required packages and dependencies.

## Running the Application

### Development Mode (Recommended)

For the best development experience with hot reloading:

```bash
npm run vite:dev
```

The application will start on `http://localhost:5173` (or another available port).

### Full Tauri Application (Desktop App)

To run as a desktop application (requires additional setup):

```bash
npm run dev
```

**Note**: This requires the Rust toolchain and Windows SDK. If you encounter build errors, use the Vite development mode instead.

### Production Build

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` folder.

## Usage Instructions

### Getting Started

1. **Launch the Application**: Open your browser to the development server URL
2. **Login/Signup**: Create an account or use existing credentials
3. **Navigate to Tactics Board**: Click "Tactics" in the sidebar

### Tactics Board Features

- **Left Sidebar**: Player list, formations, and team management
- **Center Field**: Interactive soccer field with drag-and-drop players
- **Right Sidebar**: Tactical tools, playbook, and analysis
- **Bottom Panel**: Dugout with substitutes and tactical options

### Key Controls

- **Drag & Drop**: Move players around the field
- **Right Click**: Access context menus for players and positions
- **Toolbar**: Access drawing tools, formations, and tactical options
- **Presentation Mode**: Clean view for presentations and analysis

## Project Structure

```
Astral Turf/
├── components/          # React components
│   ├── field/          # Soccer field and tactical components
│   ├── sidebar/        # Left and right sidebar components
│   ├── ui/             # UI components and icons
│   └── Layout.tsx      # Main layout wrapper
├── pages/              # Application pages
├── context/            # React context providers
├── hooks/              # Custom React hooks
├── services/           # API and service functions
├── types.ts            # TypeScript type definitions
├── constants.ts        # Application constants
└── index.html          # Main HTML entry point
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   npm run vite:dev -- --port 8081
   ```

2. **Build Errors with Tauri**
   - Use `npm run vite:dev` instead of `npm run dev`
   - Tauri requires additional system dependencies

3. **Missing Dependencies**
   ```bash
   npm install
   ```

4. **Browser Compatibility**
   - Use a modern browser (Chrome, Firefox, Safari, Edge)
   - Enable JavaScript

### Performance Tips

- **Close unused browser tabs** for better performance
- **Use Chrome DevTools** to monitor performance
- **Clear browser cache** if experiencing issues

## Development

### Available Scripts

- `npm run vite:dev` - Start development server (Vite only)
- `npm run dev` - Start full Tauri development
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run tauri dev` - Start Tauri development mode

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Build Tool**: Vite
- **Desktop**: Tauri (optional)
- **State Management**: React Context
- **Routing**: React Router
- **Styling**: Tailwind CSS with custom themes

## Support

For issues, suggestions, or questions:

1. Check the troubleshooting section above
2. Ensure all prerequisites are installed correctly
3. Verify your Node.js version is 18.0 or higher

## License

This project is for personal and educational use.

---

**Enjoy managing your football team with Astral Turf!** ⚽🏆
