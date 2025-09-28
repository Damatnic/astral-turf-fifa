#!/usr/bin/env node
/* eslint-env node */

import net from 'net';

function checkPort(port) {
  return new Promise(resolve => {
    const server = net.createServer();

    server.listen(port, () => {
      server.once('close', () => {
        resolve(true); // Port is available
      });
      server.close();
    });

    server.on('error', () => {
      resolve(false); // Port is in use
    });
  });
}

async function findAvailablePort(startPort = 3000, maxPort = 3100) {
  for (let port = startPort; port <= maxPort; port++) {
    const isAvailable = await checkPort(port);
    if (isAvailable) {
      console.log(`✅ Port ${port} is available`);
      return port;
    } else {
      console.log(`❌ Port ${port} is in use`);
    }
  }

  console.log(`⚠️  No available ports found between ${startPort}-${maxPort}`);
  return null;
}

// If run directly
const args = process.argv.slice(2);
const startPort = parseInt(args[0]) || 3000;
const maxPort = parseInt(args[1]) || 3100;

console.log(`🔍 Checking ports from ${startPort} to ${maxPort}...`);
findAvailablePort(startPort, maxPort).then(port => {
  if (port) {
    console.log(`\n🚀 You can use: npx vite --port ${port}`);
    process.exit(0);
  } else {
    process.exit(1);
  }
});

export { checkPort, findAvailablePort };
