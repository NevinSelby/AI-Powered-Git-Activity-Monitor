import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

console.log('🔍 Build Verification Script');
console.log('========================');

const clientPath = join(process.cwd(), 'client');
const distPath = join(clientPath, 'dist');

console.log('Current directory:', process.cwd());
console.log('Client path:', clientPath);
console.log('Dist path:', distPath);

// Check if client directory exists
if (existsSync(clientPath)) {
  console.log('✅ Client directory exists');
  console.log('Client contents:', readdirSync(clientPath));
  
  // Check if dist directory exists
  if (existsSync(distPath)) {
    console.log('✅ Dist directory exists');
    console.log('Dist contents:', readdirSync(distPath));
    
    // Check for index.html
    const indexPath = join(distPath, 'index.html');
    if (existsSync(indexPath)) {
      console.log('✅ index.html exists');
    } else {
      console.log('❌ index.html missing');
    }
  } else {
    console.log('❌ Dist directory missing');
  }
} else {
  console.log('❌ Client directory missing');
}

console.log('========================'); 