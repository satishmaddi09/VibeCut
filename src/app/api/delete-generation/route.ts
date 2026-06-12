import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('generationId');

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const bucketName = 'video-generator'; // Make sure this matches your Supabase storage bucket name

    console.log(`Starting cleanup for generation: ${generationId}`);

    // List all files in the generations/{generationId}/inputs folder
    const { data: inputFiles, error: listInputError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .list(`generations/${generationId}/inputs`);

    if (listInputError) {
      console.warn("Could not list input files (might not exist):", listInputError.message);
    }

    // List all files in the generations/{generationId}/ root folder (like output.mp4)
    const { data: rootFiles, error: listRootError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .list(`generations/${generationId}`);

    if (listRootError) {
      console.warn("Could not list root files (might not exist):", listRootError.message);
    }

    const filesToRemove: string[] = [];

    // Collect paths to delete
    if (inputFiles && inputFiles.length > 0) {
      inputFiles.forEach(file => {
        filesToRemove.push(`generations/${generationId}/inputs/${file.name}`);
      });
    }

    if (rootFiles && rootFiles.length > 0) {
      rootFiles.forEach(file => {
        // We only want to target files directly in the root (like output.mp4)
        // Note: listing might contain the directory 'inputs' itself, which we skip since we list and delete its children specifically
        if (file.name !== 'inputs' && file.name !== '.emptyFolderPlaceholder') {
          filesToRemove.push(`generations/${generationId}/${file.name}`);
        }
      });
    }

    if (filesToRemove.length === 0) {
      return NextResponse.json({ success: true, message: "No files found to clean up." });
    }

    console.log(`Deleting files from Supabase Storage:`, filesToRemove);
    const { data: deleteData, error: deleteError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .remove(filesToRemove);

    if (deleteError) {
      console.error("Supabase file deletion error:", deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${filesToRemove.length} files.`,
      deletedFiles: filesToRemove
    });

  } catch (error: any) {
    console.error("Delete API error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete generation" }, { status: 500 });
  }
}
