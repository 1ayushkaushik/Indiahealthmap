const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Path to your logo
const logoPath = path.join(__dirname, '../public/logo.png');
// Output directory for favicons
const outputDir = path.join(__dirname, '../public');

// Create the output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate favicon.ico (multiple sizes in one .ico file)
async function generateFavicon() {
  try {
    // Create 16x16 PNG
    await sharp(logoPath)
      .resize(16, 16)
      .toFile(path.join(outputDir, 'favicon-16x16.png'));

    // Create 32x32 PNG
    await sharp(logoPath)
      .resize(32, 32)
      .toFile(path.join(outputDir, 'favicon-32x32.png'));

    // Create 48x48 PNG for favicon.ico
    await sharp(logoPath)
      .resize(48, 48)
      .toFile(path.join(outputDir, 'favicon-48x48.png'));

    // Create Apple Touch Icon (180x180)
    await sharp(logoPath)
      .resize(180, 180)
      .toFile(path.join(outputDir, 'apple-touch-icon.png'));

    // Create OpenGraph image (1200x630)
    await sharp(logoPath)
      .resize(1200, 630, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .toFile(path.join(outputDir, 'og-image.png'));

    console.log('Favicon images generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// Create a simple site.webmanifest file
function createWebManifest() {
  const manifest = {
    name: 'Disease Visualization Dashboard',
    short_name: 'Disease Dashboard',
    icons: [
      {
        src: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png'
      },
      {
        src: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png'
      }
    ],
    theme_color: '#ffffff',
    background_color: '#ffffff',
    display: 'standalone'
  };

  fs.writeFileSync(
    path.join(outputDir, 'site.webmanifest'),
    JSON.stringify(manifest, null, 2)
  );
  console.log('Web manifest created successfully!');
}

// Run the functions
generateFavicon();
createWebManifest(); 