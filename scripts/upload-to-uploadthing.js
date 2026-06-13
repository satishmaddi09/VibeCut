const { UTApi } = require('uploadthing/server');
const fs = require('fs');
const path = require('path');

const token = process.env.UPLOADTHING_TOKEN;
const generationId = process.env.GENERATION_ID;
const filePath = process.env.FILE_PATH || 'out/video.mp4';

if (!token) {
  console.error("Error: Missing UPLOADTHING_TOKEN environment variable. Please make sure UPLOADTHING_TOKEN is set in your GitHub Repository Secrets.");
  process.exit(1);
}
if (!generationId) {
  console.error("Error: Missing GENERATION_ID environment variable.");
  process.exit(1);
}

// Initialize UTApi with the token
const utapi = new UTApi({ token });

async function upload() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at path: ${filePath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const customId = `${generationId}-video`;

    console.log(`Uploading compiled video to UploadThing...`);
    console.log(`Source: ${filePath}`);
    console.log(`Custom ID: ${customId}`);

    // Create a file object with customId property assigned
    const file = new File([fileBuffer], 'output.mp4', { type: 'video/mp4' });
    Object.assign(file, { customId: customId });

    const response = await utapi.uploadFiles([file]);

    console.log("Upload request completed. Response details:", response);
    
    // Check if any errors occurred during upload
    if (!response || response.length === 0) {
      console.error("Upload failed: empty response received.");
      process.exit(1);
    }

    const fileData = response[0];
    if (fileData.error) {
      console.error("Upload failed with error:", fileData.error);
      process.exit(1);
    }

    console.log("Upload successful! Public URL:", fileData.data ? fileData.data.url : fileData.url);
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error during UploadThing upload:", err);
    process.exit(1);
  }
}

upload();
