import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Checking React dependencies...');

// Check package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const packageLockPath = path.join(__dirname, 'package-lock.json');
const nodeModulesPath = path.join(__dirname, 'node_modules');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
console.log(`- package.json react: ${packageJson.dependencies.react}`);
console.log(`- package.json react-dom: ${packageJson.dependencies['react-dom']}`);
console.log(`- package.json react-router: ${packageJson.dependencies['react-router'] || 'not found'}`);
console.log(`- package.json react-router-dom: ${packageJson.dependencies['react-router-dom']}`);

let hasError = false;
let reactVersion = '';
let reactRouterVersion = '';

// Check if node_modules has the correct versions
try {
    const reactPackagePath = path.join(nodeModulesPath, 'react', 'package.json');
    const reactDomPackagePath = path.join(nodeModulesPath, 'react-dom', 'package.json');
    const routerDomPackagePath = path.join(nodeModulesPath, 'react-router-dom', 'package.json');

    if (fs.existsSync(reactPackagePath)) {
        const reactPackage = JSON.parse(fs.readFileSync(reactPackagePath, 'utf8'));
        reactVersion = reactPackage.version;
        console.log(`- Installed react: ${reactVersion}`);

        // Verify React 18.x
        if (!reactVersion.startsWith('18.')) {
            console.error('❌ ERROR: React version must be 18.x');
            hasError = true;
        }
    } else {
        console.log('❌ React not installed in node_modules');
        hasError = true;
    }

    if (fs.existsSync(reactDomPackagePath)) {
        const reactDomPackage = JSON.parse(fs.readFileSync(reactDomPackagePath, 'utf8'));
        console.log(`- Installed react-dom: ${reactDomPackage.version}`);

        // Verify react-dom matches react version
        if (reactDomPackage.version !== reactVersion) {
            console.error('❌ ERROR: react-dom version does not match react version');
            hasError = true;
        }
    } else {
        console.log('❌ React DOM not installed in node_modules');
        hasError = true;
    }

    if (fs.existsSync(routerDomPackagePath)) {
        const routerDomPackage = JSON.parse(fs.readFileSync(routerDomPackagePath, 'utf8'));
        reactRouterVersion = routerDomPackage.version;
        console.log(`- Installed react-router-dom: ${reactRouterVersion}`);

        // Verify React Router 6.x
        if (!reactRouterVersion.startsWith('6.')) {
            console.error('❌ ERROR: React Router version must be 6.x');
            hasError = true;
        }
    } else {
        console.log('❌ React Router DOM not installed in node_modules');
        hasError = true;
    }
} catch (error) {
    console.error('Error checking node_modules:', error);
    hasError = true;
}

if (hasError) {
    console.error('\n❌ Dependency check failed!');
    console.error('Please run: npm install react@18.2.0 react-dom@18.2.0 react-router-dom@6.20.0');
    console.error('Then delete node_modules and package-lock.json and run npm install again');
    process.exit(1); // Exit with error code
} else {
    console.log('✅ Dependency check complete - using React 18 with Router 6');
} 