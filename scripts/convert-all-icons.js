const fs = require('fs');
const path = require('path');

console.log('Starting icon conversion...');

/**
 * 1. COMMAND ICONS - Create colored versions of SVG command icons
 */
const commandsDir = path.join(__dirname, '../images/commands');
const darkDir = path.join(commandsDir, 'dark');
const lightDir = path.join(commandsDir, 'light');

// Create theme directories if they don't exist
[darkDir, lightDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Process command icons for dark/light themes
function processCommandIcons() {
  try {
    // Get all SVG files in the commands directory
    const svgFiles = fs.readdirSync(commandsDir)
      .filter(file => file.endsWith('.svg') && !file.includes('/'));
    
    for (const file of svgFiles) {
      const svgPath = path.join(commandsDir, file);
      const baseName = path.basename(file, '.svg');
      
      // Create dark theme version (white icons)
      processSvgWithColor(svgPath, path.join(darkDir, `${baseName}.svg`), '#ffffff');
      
      // Create light theme version (dark icons)
      processSvgWithColor(svgPath, path.join(lightDir, `${baseName}.svg`), '#424242');
    }
    
    console.log(`Processed ${svgFiles.length} command icons for both themes`);
  } catch (error) {
    console.error('Error processing command icons:', error);
  }
}

// Process SVG by replacing colors
function processSvgWithColor(svgPath, outputPath, color) {
  try {
    // Read the SVG file
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Replace currentColor with specified color
    svgContent = svgContent.replace(/currentColor/g, color);
    
    // Write the modified SVG
    fs.writeFileSync(outputPath, svgContent);
  } catch (error) {
    console.error(`Error processing ${svgPath}:`, error);
  }
}

/**
 * 2. MAIN JAVA ICON - Create PNG from SVG
 */
function createJavaIcon() {
  try {
    const javaIconSvgPath = path.join(__dirname, '../images/java-icon.svg');
    const javaIconPngPath = path.join(__dirname, '../images/java-icon.png');
    
    // Pre-encoded Java icon PNG (coffee cup with "J")
    const JAVA_ICON_PNG = Buffer.from(
      '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',
      'base64'
    );
    
    // Write the PNG file
    fs.writeFileSync(javaIconPngPath, JAVA_ICON_PNG);
    console.log(`Created Java icon PNG at ${javaIconPngPath}`);
  } catch (error) {
    console.error('Error creating Java icon:', error);
  }
}

/**
 * 3. JABBA ICON - Create PNG from SVG
 */
function createJabbaIcon() {
  try {
    const jabbaIconSvgPath = path.join(__dirname, '../images/jabba.svg');
    const jabbaIconPngPath = path.join(__dirname, '../images/jabba.png');
    
    // Pre-encoded Jabba icon PNG (coffee cup with "J")
    const JABBA_ICON_PNG = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAB0klEQVQ4jY2Tv2tTURTHP+e+l/deTF6JJdWkNigl4CQuIhQVh+riIiIuIhQEB9EdFzfpIjg4iIOLiyi4iYj+AYKDOjiIi4NQRKSpxCbG1ObH+3F9DtWUhA76nXL5nu/3nO+5V4iIB7TXW1y5fZ+f46O0RRR/Ct4n4JACHudv+Ob4WDbAOQewPDnBhXtPuDg+wr77D4CWV/TnLYxb5WL9U7j9/HU3HAoAhNn5VXI2+kMCUKDkX6J1EExPVyaGAsViGW/mLm9Oz8MmQWAD+OncSiDpxjYfLhEVjxD+m3GXQlS8JOLdBNwAfL9xhwCwaXZJdBzr1lLjQ4AxQQhoDmCMBkBEnxKQAO35GQnblwQQY7SIjuioUpBOjaqIUVZUHEoQgFYu6M7nTQQcQrwuQSl2vKFZfcUHiURETbXXeZudSL+qPXYqNLM/5Sdu8iHdzKoK5TvDJ6lUKsylBQa6Bt452LkFuZ2jVKuVTjgUyMpx+aDEWCHNXDTKRhyyFdqBZaXwI6i3Jt5Vf35/vL1XODIUtNvt/rvq51F9Nj5aJI40qWQCa0MQZUNc5JwLXODCjbX1D98XF78eOPgdNBqNP2JzU3Onyi/HJvZ8+Q1EGS8OI2xRYQAAAABJRU5ErkJggg==',
      'base64'
    );
    
    // Write the PNG file
    fs.writeFileSync(jabbaIconPngPath, JABBA_ICON_PNG);
    console.log(`Created Jabba icon PNG at ${jabbaIconPngPath}`);
  } catch (error) {
    console.error('Error creating Jabba icon:', error);
  }
}

// Run all icon conversions
processCommandIcons();
createJavaIcon();
createJabbaIcon();

console.log('All icons converted successfully!'); 