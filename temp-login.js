const { spawn } = require('child_process');

const vercel = spawn('vercel', ['login'], {
    stdio: ['pipe', 'inherit', 'inherit']
});

// Auto-respond to login prompts
setTimeout(() => {
    vercel.stdin.write('\n'); // Press enter for email login
}, 2000);

vercel.on('close', (code) => {
    console.log('Vercel login completed with code:', code);
    process.exit(code);
});
