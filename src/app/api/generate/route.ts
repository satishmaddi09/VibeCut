import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const storyboardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    visualTheme: {
      type: Type.OBJECT,
      properties: {
        backgroundGradientStart: { type: Type.STRING, description: "CSS color hex code, e.g., #8b5cf6" },
        backgroundGradientEnd: { type: Type.STRING, description: "CSS color hex code, e.g., #ec4899" },
        textColor: { type: Type.STRING, description: "CSS color hex code, e.g., #ffffff" },
        fontFamily: { type: Type.STRING, description: "Font name, e.g., Inter, Outfit" },
      },
      required: ["backgroundGradientStart", "backgroundGradientEnd", "textColor", "fontFamily"],
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          durationInFrames: { type: Type.INTEGER, description: "Duration of this scene in frames. 30 frames = 1 second. Typically 60 to 120 frames." },
          imageIdx: { type: Type.INTEGER, description: "0-based index of the uploaded image to use in this scene, or -1 if no image." },
          textOverlay: { type: Type.STRING, description: "Catchy overlay text to show on screen for this scene." },
          textAnimation: { 
            type: Type.STRING, 
            enum: ["fade", "slide-up", "zoom-in", "none"]
          },
          imageAnimation: { 
            type: Type.STRING, 
            enum: ["pan", "zoom", "none"]
          },
        },
        required: ["id", "durationInFrames", "imageIdx", "textOverlay", "textAnimation", "imageAnimation"],
      }
    }
  },
  required: ["visualTheme", "scenes"]
};

export async function POST(req: Request) {
  try {
    const { prompt, imageUrls, generationId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    if (!generationId) {
      return NextResponse.json({ error: 'Generation ID is required' }, { status: 400 });
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    // Build the contents for Gemini
    const contents: any[] = [];
    
    // Download and convert images to Gemini inline data if provided
    if (imageUrls && imageUrls.length > 0) {
      contents.push({
        text: `Here are the images uploaded by the user. Please analyze them and incorporate them into the storyboard scenes by referencing their index in the array (0 to ${imageUrls.length - 1}).`
      });

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const imgRes = await fetch(imageUrls[i]);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64Str = Buffer.from(buffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            contents.push({
              inlineData: {
                data: base64Str,
                mimeType: mimeType
              }
            });
          }
        } catch (err) {
          console.error(`Error downloading image ${imageUrls[i]}:`, err);
        }
      }
    }

    contents.push({
      text: `Create a storyboard for a short, engaging video based on the following user prompt: "${prompt}".
      
      You must return a strictly structured JSON response that follows the provided schema. 
      For each scene:
      - Decide if it should display one of the uploaded images (use imageIdx between 0 and ${imageUrls ? imageUrls.length - 1 : -1}). If no image fits or if no images were uploaded, set imageIdx to -1.
      - Write a short, highly engaging textOverlay that appears on screen. Keep it concise (under 8 words per scene).
      - Select appropriate text and image animations that match the vibe of the prompt.
      - Ensure the duration in frames is appropriate (e.g. 90 frames for 3 seconds). The total video duration should be around 6 to 15 seconds. Make sure scenes add up to this.`
    });

    console.log("Calling Gemini API...");
    // Call Gemini API
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: storyboardSchema,
      }
    });

    const storyboardText = response.text;
    if (!storyboardText) {
      throw new Error("Empty response from Gemini API");
    }

    const storyboard = JSON.parse(storyboardText);

    // Add image URLs to the storyboard scenes for Remotion mapping
    if (storyboard.scenes) {
      storyboard.scenes = storyboard.scenes.map((scene: any) => {
        if (scene.imageIdx >= 0 && imageUrls && imageUrls[scene.imageIdx]) {
          return {
            ...scene,
            imageUrl: imageUrls[scene.imageIdx]
          };
        }
        return { ...scene, imageUrl: null };
      });
    }

    // Trigger GitHub repository_dispatch webhook
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;

    if (!githubToken || !repoOwner || !repoName) {
      console.warn("GitHub webhook variables are missing. Skipping dispatch. Generating storyboard only.", {
        hasToken: !!githubToken,
        owner: repoOwner,
        repo: repoName
      });
      return NextResponse.json({
        success: true,
        storyboard,
        generationId,
        dispatched: false,
        message: "Storyboard generated successfully, but GitHub Action was not triggered (missing configuration)."
      });
    }

    console.log(`Triggering GitHub Action dispatch for ${repoOwner}/${repoName}...`);
    const dispatchResponse = await fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VibeCut-App',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'render-video',
        client_payload: {
          generationId,
          storyboard
        }
      })
    });

    if (!dispatchResponse.ok) {
      const errorText = await dispatchResponse.text();
      console.error("GitHub dispatch failed:", errorText);
      return NextResponse.json({
        success: true,
        storyboard,
        generationId,
        dispatched: false,
        error: `Failed to trigger GitHub Action: ${errorText}`
      });
    }

    return NextResponse.json({
      success: true,
      storyboard,
      generationId,
      dispatched: true
    });

  } catch (error: any) {
    console.error("Generate API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process generation" }, { status: 500 });
  }
}
