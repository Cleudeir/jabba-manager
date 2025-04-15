const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

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
async function createJavaIcon() {
  try {
    const javaIconSvgPath = path.join(__dirname, '../images/java-icon.svg');
    const javaIconPngPath = path.join(__dirname, '../images/java-icon.png');

    // Use sharp to convert SVG to PNG
    await sharp(javaIconSvgPath)
      .png()
      .toFile(javaIconPngPath);

    console.log(`Created Java icon PNG at ${javaIconPngPath}`);
  } catch (error) {
    console.error('Error creating Java icon:', error);
  }
}

/**
 * 3. JABBA ICON - Create PNG from SVG
 */
async function createJabbaIcon() {
  try {
    const jabbaSvgPath = path.join(__dirname, '../images/jabba.svg');
    const jabbaPngPath = path.join(__dirname, '../images/jabba.png');

    // Use sharp to convert SVG to PNG
    await sharp(jabbaSvgPath)
      .png()
      .toFile(jabbaPngPath);

    console.log(`Created Jabba icon PNG at ${jabbaPngPath}`);
  } catch (error) {
    console.error('Error creating Jabba icon:', error);
  }
}

// Run all icon conversions
// Wrap calls in an async function to handle awaits
async function runConversions() {
  processCommandIcons();
  await createJabbaIcon();
  console.log('All icons converted successfully!');
}

runConversions(); // Call the async wrapper function 