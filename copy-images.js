const fs = require('fs');
const path = require('path');

const sourceDir = 'C:\\Users\\hp\\.gemini\\antigravity-ide\\brain\\6a03d63e-c3e2-4572-a5e9-7253b8aa3ef8';
const destDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const images = {
  'hero.png': 'drought_somalia_hero_1782901309302.png',
  'nomads.png': 'water_scarcity_nomads_1782901321391.png',
  'step1.png': 'how_it_works_step1_1782901769411.png',
  'step2.png': 'how_it_works_step2_1782901780265.png',
  'step3.png': 'how_it_works_step3_1782901790506.png',
  'step4.png': 'water_well_restored_1782901341143.png',
  'well.png': 'water_well_restored_1782901341143.png'
};

for (const [destName, srcName] of Object.entries(images)) {
  const srcPath = path.join(sourceDir, srcName);
  const destPath = path.join(destDir, destName);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcName} to public/images/${destName}`);
  } else {
    console.error(`Source image not found: ${srcPath}`);
  }
}

console.log('Done! Now you can push the public/images folder to Git.');
