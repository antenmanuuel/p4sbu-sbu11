const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Function to update React dependencies
function fixDependencies() {
    console.log('Fixing React dependencies for Heroku deployment...');

    try {
        // Path to client directory
        const clientDir = path.join(__dirname, 'client');

        // Check if we're in the right directory
        if (!fs.existsSync(path.join(clientDir, 'package.json'))) {
            console.error('Client package.json not found!');
            return false;
        }

        // Install React 18 compatible versions
        console.log('Installing React 18.2.0 and compatible types...');
        execSync('npm uninstall react react-dom', { cwd: clientDir, stdio: 'inherit' });
        execSync('npm install react@18.2.0 react-dom@18.2.0 --save', { cwd: clientDir, stdio: 'inherit' });
        execSync('npm install @types/react@18.2.51 @types/react-dom@18.2.18 --save-dev', { cwd: clientDir, stdio: 'inherit' });

        console.log('React dependencies fixed successfully!');
        return true;
    } catch (error) {
        console.error('Error fixing dependencies:', error);
        return false;
    }
}

// Run the fix function
fixDependencies(); 