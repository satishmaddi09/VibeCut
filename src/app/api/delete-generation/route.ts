import { NextResponse } from 'next/server';
import { UTApi } from 'uploadthing/server';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const generationId = searchParams.get('generationId');

    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    console.log(`Starting UploadThing cleanup for generation: ${generationId}`);

    const utapi = new UTApi();

    const customIdsToRemove = [
      `${generationId}-video`,
    ];
    
    // Collect all potential input image customIds (up to 10 max)
    for (let i = 0; i < 10; i++) {
      customIdsToRemove.push(`${generationId}-image-${i}`);
    }

    console.log(`Deleting custom IDs from UploadThing:`, customIdsToRemove);
    const result = await utapi.deleteFiles(customIdsToRemove, { keyType: 'customId' });

    console.log("UploadThing deletion result:", result);

    return NextResponse.json({
      success: true,
      message: `Successfully requested deletion from UploadThing.`,
      result
    });

  } catch (error: any) {
    console.error("Delete API error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete generation from UploadThing" }, { status: 500 });
  }
}

