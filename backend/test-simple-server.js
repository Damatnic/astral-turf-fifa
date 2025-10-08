// Ultra-simple HTTP server test
const http = require('http');

const hostname = '127.0.0.1';
const port = 5555;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({
    status: 'success',
    message: 'Simple server is working!',
    path: req.url
  }));
});

server.listen(port, hostname, () => {
  console.log('\n================================');
  console.log('Simple HTTP Server Started');
  console.log('================================');
  console.log(`Server running at http://${hostname}:${port}/`);
  console.log(`Test with: http://localhost:${port}/`);
  console.log('================================\n');
});

server.on('error', (error) => {
  console.error('❌ Server Error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use`);
  }
  process.exit(1);
});
