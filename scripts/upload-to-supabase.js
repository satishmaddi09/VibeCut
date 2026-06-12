const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const generationId = process.env.GENERATION_ID;
const filePath = process.env.FILE_PATH || 'out/video.mp4';

if (!supabaseUrl || !supabaseServiceRoleKey || !generationId) {
  console.error("Error: Missing required environment variables. Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GENERATION_ID.");
  process.exit(1);
}

// Initialize Supabase Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function upload() {
  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found at path: ${filePath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    const destinationPath = `generations/${generationId}/output.mp4`;
    const bucketName = 'video-generator';

    console.log(`Uploading compiled video to Supabase storage...`);
    console.log(`Source: ${filePath}`);
    console.log(`Destination: ${bucketName}/${destinationPath}`);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(destinationPath, fileBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload failed:", error.message);
      process.exit(1);
    }

    console.log("Upload successful! File details:", data);
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error during upload:", err);
    process.exit(1);
  }
}

upload();
