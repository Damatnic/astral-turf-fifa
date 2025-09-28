# ASTRAL TURF PROJECT NOTES

## Port Configuration
- **Development Server**: Port 3000 (may conflict with other services)
- **Test Server**: Port 6025 (auto-selected, dedicated testing environment)
- **HMR Port**: Auto-selected by Vite (avoids conflicts)
- **Production**: TBD based on deployment configuration

## Testing Environment
- Test server runs on port 6025 (auto-selected to avoid conflicts)
- All tactical board features available for testing
- Comprehensive testing framework implemented
- WebSocket issues resolved with unique port allocation

## Development Guidelines
- Use port 6025 for testing and demonstrations
- Port 3000 reserved for main development
- Let Vite auto-select ports to avoid conflicts
- Check port availability before starting servers

Last Updated: $(date)