
const { spawn } = require('child_process');
const { platform } = require('os');
const fs = require('fs');
const path = require('path');

// Determine the npm command based on platform
const npmCmd = platform() === 'win32' ? 'npm.cmd' : 'npm';

// Check if electron is installed globally if not in devDependencies
try {
  require('electron');
} catch (e) {
  console.log('Electron not found in local dependencies. Checking globally...');
  // We'll proceed anyway as the user might have electron installed globally
}

// Run development server
console.log('Starting Vite development server...');
const server = spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit' });

// Wait for server to start, then run electron
console.log('Waiting for server to start...');
setTimeout(() => {
  console.log('Starting Electron...');
  
  // Set environment variable for Electron
  const env = { ...process.env, ELECTRON_RUN: 'true' };
  
  const electron = spawn(
    platform() === 'win32' ? 'npx.cmd' : 'npx', 
    ['electron', '.'], 
    { 
      stdio: 'inherit',
      env
    }
  );
  
  electron.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    server.kill();
    process.exit(code);
  });
}, 5000);

console.log('Starting development server and Electron...');
