const { spawn } = require('child_process');
const fs = require('fs');

// Create .vercel directory if it doesn't exist
if (!fs.existsSync('.vercel')) {
    fs.mkdirSync('.vercel');
}

const vercel = spawn('vercel', ['--yes', '--name', 'astral-turf'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

// Auto-respond to setup questions
let responseIndex = 0;
const responses = [
    'y\n',  // Set up and deploy?
    'y\n',  // Link to existing project?
    'astral-turf\n', // Project name
    'y\n'   // Confirm
];

const sendResponse = () => {
    if (responseIndex < responses.length) {
        setTimeout(() => {
            vercel.stdin.write(responses[responseIndex]);
            responseIndex++;
            sendResponse();
        }, 1000);
    }
};

setTimeout(sendResponse, 2000);

vercel.on('close', (code) => {
    console.log('Vercel initialization completed with code:', code);
    process.exit(code);
});
