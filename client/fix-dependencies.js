#!/usr/bin/env node
// Script to automatically fix React dependency issues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Fixing React dependencies...');

// Target versions
const TARGET_VERSIONS = {
    'react': '18.2.0',
    'react-dom': '18.2.0',
    'react-router': '6.22.3',
    'react-router-dom': '6.22.3',
    '@types/react': '18.2.51',
    '@types/react-dom': '18.2.18'
};

try {
    // Path for package.json
    const packageJsonPath = path.join(__dirname, 'package.json');

    // Check if package.json exists
    if (!fs.existsSync(packageJsonPath)) {
        console.error('❌ package.json not found in the current directory');
        process.exit(1);
    }

    // Read package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    let hasChanges = false;

    // Check and update dependencies
    if (packageJson.dependencies) {
        Object.keys(TARGET_VERSIONS).forEach(pkg => {
            if (packageJson.dependencies[pkg] && packageJson.dependencies[pkg] !== TARGET_VERSIONS[pkg]) {
                console.log(`Updating dependency: ${pkg} → ${TARGET_VERSIONS[pkg]}`);
                packageJson.dependencies[pkg] = TARGET_VERSIONS[pkg];
                hasChanges = true;
            }
        });
    }

    // Check and update devDependencies
    if (packageJson.devDependencies) {
        Object.keys(TARGET_VERSIONS).forEach(pkg => {
            if (packageJson.devDependencies[pkg] && packageJson.devDependencies[pkg] !== TARGET_VERSIONS[pkg]) {
                console.log(`Updating devDependency: ${pkg} → ${TARGET_VERSIONS[pkg]}`);
                packageJson.devDependencies[pkg] = TARGET_VERSIONS[pkg];
                hasChanges = true;
            }
        });
    }

    // Check and update overrides
    if (packageJson.overrides) {
        Object.keys(TARGET_VERSIONS).forEach(pkg => {
            if (packageJson.overrides[pkg] && packageJson.overrides[pkg] !== TARGET_VERSIONS[pkg]) {
                console.log(`Updating override: ${pkg} → ${TARGET_VERSIONS[pkg]}`);
                packageJson.overrides[pkg] = TARGET_VERSIONS[pkg];
                hasChanges = true;
            }
        });
    }

    // Write updated package.json if changes were made
    if (hasChanges) {
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        console.log('✅ package.json updated successfully');

        // Ask if the user wants to reinstall dependencies
        console.log('\n🧹 Cleaning up node_modules and reinstalling dependencies...');
        try {
            // Clean node_modules and reinstall
            if (fs.existsSync(path.join(__dirname, 'node_modules'))) {
                console.log('- Removing node_modules directory...');
                fs.rmSync(path.join(__dirname, 'node_modules'), { recursive: true, force: true });
            }

            if (fs.existsSync(path.join(__dirname, 'package-lock.json'))) {
                console.log('- Removing package-lock.json...');
                fs.unlinkSync(path.join(__dirname, 'package-lock.json'));
            }

            console.log('- Installing dependencies...');
            execSync('npm install', { stdio: 'inherit', cwd: __dirname });

            console.log('\n✅ All dependencies fixed and reinstalled successfully!');
        } catch (error) {
            console.error('\n❌ Error during dependency reinstallation:', error.message);
            console.log('Please run these commands manually:');
            console.log('  1. rm -rf node_modules');
            console.log('  2. rm package-lock.json');
            console.log('  3. npm install');
        }
    } else {
        console.log('✅ No changes needed. All dependencies are already at correct versions.');
    }
} catch (error) {
    console.error('❌ Error fixing dependencies:', error);
    process.exit(1);
} 