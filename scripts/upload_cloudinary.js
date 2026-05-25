const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load env from frontend
dotenv.config({ path: path.resolve(__dirname, '../frontend/.env.local') });

const cloudinary = require('cloudinary').v2;
// Explicitly configure if CLOUDINARY_URL is present
if (process.env.CLOUDINARY_URL) {
  // It should pick it up automatically, but just to be sure:
  console.log('Using CLOUDINARY_URL from env');
}

console.log('Cloudinary Configured:', cloudinary.config().cloud_name);

const photosDir = path.resolve(__dirname, '../frontend/public/candidate/2026/photos');
const files = fs.readdirSync(photosDir).filter(file => file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg'));

console.log(`Found ${files.length} photos to upload.`);

async function uploadPhotos() {
  let successCount = 0;
  let failCount = 0;

  // We can upload in batches of 10 to avoid overwhelming the API and get it done fast
  const batchSize = 10;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(files.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(photosDir, file);
      // Public ID will be like knowyourmla/candidates/2026/ALANDUR_A.SARAVANAN
      const publicId = `knowyourmla/candidates/2026/${path.parse(file).name}`;
      
      try {
        await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          overwrite: true,
          // Let Cloudinary handle optimization automatically when served, but we can set default tags
          tags: ['knowyourmla', 'candidates', '2026']
        });
        successCount++;
      } catch (err) {
        console.error(`Failed to upload ${file}:`, err.message);
        failCount++;
      }
    }));
  }
  
  console.log(`Upload Complete. Success: ${successCount}, Failed: ${failCount}`);
}

uploadPhotos();
