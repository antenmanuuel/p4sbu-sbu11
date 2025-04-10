/**
 * Script to generate Heroku environment variable commands from your .env files
 * 
 * Usage: 
 * 1. Make sure you have Node.js installed
 * 2. Run: node generate-heroku-env.js
 * 3. Copy and paste the output into your terminal
 */

const fs = require('fs');
const path = require('path');

// Files to read
const filesToRead = [
    { path: '.env', prefix: '' },
    { path: 'server/.env', prefix: '' },
    { path: 'client/.env', prefix: 'VITE_' }
];

// Output commands
let commands = [];
let envContent = '';

// Process each file
filesToRead.forEach(file => {
    try {
        if (fs.existsSync(file.path)) {
            const content = fs.readFileSync(file.path, 'utf8');
            const lines = content.split('\n');

            lines.forEach(line => {
                // Skip comments and empty lines
                if (line.trim().startsWith('#') || line.trim() === '') return;

                // Parse key=value
                const match = line.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim();

                    // Skip if it's a client-side variable but doesn't start with VITE_
                    if (file.path.includes('client') && !key.startsWith('VITE_')) return;

                    // Add to commands
                    commands.push(`heroku config:set ${key}="${value}"`);

                    // Add to .env.production content
                    envContent += `${key}=${value}\n`;
                }
            });
        }
    } catch (err) {
        console.error(`Error reading ${file.path}:`, err);
    }
});

// Remove duplicates (keeping the last occurrence)
commands = [...new Set(commands)];

// Output results
console.log('\n=== HEROKU CONFIG COMMANDS ===');
console.log('Copy and paste these commands to set up your Heroku environment:');
console.log(commands.join('\n'));

// Create .env.production file
fs.writeFileSync('.env.production', envContent);
console.log('\n.env.production file created.');
console.log('You can use this file with the heroku-config plugin:');
console.log('heroku plugins:install heroku-config');
console.log('heroku config:push -f .env.production');
console.log('\nWARNING: Do not commit .env.production to your repository!');
console.log('Add it to .gitignore if it\'s not already there.'); 