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

console.log(`Found ${files.length} local photos.`);

async function getExistingPublicIds() {
  console.log('Fetching existing images from Cloudinary to skip duplicates...');
  const existingIds = new Set();
  let next_cursor = null;
  
  do {
    const result = await cloudinary.search
      .expression('folder:knowyourmla/candidates/2026')
      .max_results(500)
      .next_cursor(next_cursor)
      .execute();
      
    result.resources.forEach(res => existingIds.add(res.public_id));
    next_cursor = result.next_cursor;
  } while (next_cursor);
  
  console.log(`Found ${existingIds.size} existing photos on Cloudinary.`);
  return existingIds;
}

async function uploadPhotos() {
  const existingIds = await getExistingPublicIds();
  
  // Filter out files that already exist on Cloudinary
  const filesToUpload = files.filter(file => {
    const publicId = `knowyourmla/candidates/2026/${path.parse(file).name}`;
    return !existingIds.has(publicId);
  });
  
  console.log(`Skipping ${files.length - filesToUpload.length} existing photos.`);
  console.log(`Uploading ${filesToUpload.length} new photos...`);
  
  if (filesToUpload.length === 0) {
    console.log('Nothing to upload!');
    return;
  }

  let successCount = 0;
  let failCount = 0;

  const batchSize = 10;
  for (let i = 0; i < filesToUpload.length; i += batchSize) {
    const batch = filesToUpload.slice(i, i + batchSize);
    console.log(`Uploading batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(filesToUpload.length / batchSize)}...`);
    
    await Promise.all(batch.map(async (file) => {
      const filePath = path.join(photosDir, file);
      const publicId = `knowyourmla/candidates/2026/${path.parse(file).name}`;
      
      try {
        await cloudinary.uploader.upload(filePath, {
          public_id: publicId,
          overwrite: false,
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
