import fs from 'fs';
import path from 'path';

// Create temp directory
const tempDir = path.join(process.cwd(), 'temp');
console.log(`Attempting to create temp directory at: ${tempDir}`);

try {
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    console.log(`Successfully created temp directory at: ${tempDir}`);
  } else {
    console.log(`Temp directory already exists at: ${tempDir}`);
  }
} catch (error) {
  console.error('Error creating temp directory:', error);
}

// Test writing to the directory
try {
  const testFile = path.join(tempDir, 'test.txt');
  fs.writeFileSync(testFile, 'Test file content');
  console.log(`Successfully wrote test file to: ${testFile}`);
  
  // Read the file back
  const content = fs.readFileSync(testFile, 'utf8');
  console.log(`Read back test file content: ${content}`);
  
  // Clean up
  fs.unlinkSync(testFile);
  console.log(`Successfully deleted test file: ${testFile}`);
} catch (error) {
  console.error('Error with file operations:', error);
}
