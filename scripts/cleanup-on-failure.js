const { UTApi } = require('uploadthing/server');

const token = process.env.UPLOADTHING_TOKEN;
const generationId = process.env.GENERATION_ID;

if (!token || !generationId) {
  console.log("Cleanup skipped: Missing UPLOADTHING_TOKEN or GENERATION_ID.");
  process.exit(0);
}

const utapi = new UTApi({ token });

async function cleanup() {
  try {
    console.log(`[Automatic Cleanup] Pipeline run failed. Wiping files for generation: ${generationId}`);

    const customIdsToRemove = [
      `${generationId}-video`,
    ];
    for (let i = 0; i < 10; i++) {
      customIdsToRemove.push(`${generationId}-image-${i}`);
    }

    console.log(`Deleting custom IDs from UploadThing...`, customIdsToRemove);
    const result = await utapi.deleteFiles(customIdsToRemove, { keyType: 'customId' });

    console.log("Cleanup request completed. Result:", result);
    process.exit(0);
  } catch (err) {
    console.error("Unexpected error during cleanup:", err);
    process.exit(0);
  }
}

cleanup();
