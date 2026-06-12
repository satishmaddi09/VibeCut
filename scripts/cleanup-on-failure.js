const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const generationId = process.env.GENERATION_ID;

if (!supabaseUrl || !supabaseServiceRoleKey || !generationId) {
  console.log("Cleanup skipped: Missing credentials or generation ID.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function cleanup() {
  try {
    const bucketName = 'video-generator';
    console.log(`[Automatic Cleanup] Run failed. Wiping files for generation: ${generationId}`);

    // List files inside inputs/
    const { data: inputFiles, error: listInputError } = await supabase.storage
      .from(bucketName)
      .list(`generations/${generationId}/inputs`);

    if (listInputError) {
      console.warn("Could not list inputs folder:", listInputError.message);
    }

    // List files in root of the generation directory
    const { data: rootFiles, error: listRootError } = await supabase.storage
      .from(bucketName)
      .list(`generations/${generationId}`);

    if (listRootError) {
      console.warn("Could not list generation folder:", listRootError.message);
    }

    const filesToRemove = [];

    if (inputFiles && inputFiles.length > 0) {
      inputFiles.forEach(file => {
        filesToRemove.push(`generations/${generationId}/inputs/${file.name}`);
      });
    }

    if (rootFiles && rootFiles.length > 0) {
      rootFiles.forEach(file => {
        if (file.name !== 'inputs' && file.name !== '.emptyFolderPlaceholder') {
          filesToRemove.push(`generations/${generationId}/${file.name}`);
        }
      });
    }

    if (filesToRemove.length === 0) {
      console.log("No temporary files found in storage. Nothing to clean up.");
      process.exit(0);
    }

    console.log(`Deleting ${filesToRemove.length} files from Supabase Storage...`, filesToRemove);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove(filesToRemove);

    if (error) {
      console.error("Failed to delete files:", error.message);
      process.exit(0);
    }

    console.log("Cleanup completed successfully! Storage is clean.");
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error during cleanup:", err);
    process.exit(0);
  }
}

cleanup();
