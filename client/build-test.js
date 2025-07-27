import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 Build Test Script');
console.log('==================');

try {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔨 Running build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build completed');
  
  const distPath = join(process.cwd(), 'dist');
  if (existsSync(distPath)) {
    console.log('✅ Dist directory exists');
    console.log('📁 Dist contents:', readdirSync(distPath));
  } else {
    console.log('❌ Dist directory missing');
  }
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} 