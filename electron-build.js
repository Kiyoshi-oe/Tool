
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Save original package.json
const packageJsonPath = path.join(__dirname, 'package.json');
const originalPackageJson = fs.readFileSync(packageJsonPath, 'utf8');
const packageData = JSON.parse(originalPackageJson);

// Create a temporary modified package.json with electron in devDependencies
const tempPackageData = { ...packageData };

// Move electron and electron-builder to devDependencies if they exist in dependencies
if (tempPackageData.dependencies && tempPackageData.dependencies.electron) {
  if (!tempPackageData.devDependencies) {
    tempPackageData.devDependencies = {};
  }
  
  tempPackageData.devDependencies.electron = tempPackageData.dependencies.electron;
  delete tempPackageData.dependencies.electron;
}

if (tempPackageData.dependencies && tempPackageData.dependencies['electron-builder']) {
  if (!tempPackageData.devDependencies) {
    tempPackageData.devDependencies = {};
  }
  
  tempPackageData.devDependencies['electron-builder'] = tempPackageData.dependencies['electron-builder'];
  delete tempPackageData.dependencies['electron-builder'];
}

// Write temporary package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(tempPackageData, null, 2));

console.log('Running electron-builder with temporary package.json...');

try {
  // Run electron-builder
  execSync('npx electron-builder build --win', { stdio: 'inherit' });
} catch (error) {
  console.error('Build failed:', error);
} finally {
  // Restore original package.json
  fs.writeFileSync(packageJsonPath, originalPackageJson);
  console.log('Restored original package.json');
}
