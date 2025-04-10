import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== BUILD ENVIRONMENT INFO ===');
console.log('Node version:', process.version);
console.log('NPM version:', process.env.npm_version || 'unknown');
console.log('Current directory:', process.cwd());

try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    console.log('React version:', packageJson.dependencies.react);
    console.log('React Router version:', packageJson.dependencies['react-router-dom']);
    console.log('=== END ENVIRONMENT INFO ===');
} catch (err) {
    console.error('Error reading package.json:', err);
} 