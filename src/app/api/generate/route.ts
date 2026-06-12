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
        backgroundGradientStart: { type: Type.STRING, description: "CSS color hex code, e.g., #000000" },
        backgroundGradientEnd: { type: Type.STRING, description: "CSS color hex code, e.g., #111111" },
        textColor: { type: Type.STRING, description: "CSS color hex code, e.g., #ffffff" },
        fontFamily: { type: Type.STRING, description: "Font name, e.g., Montserrat, Segoe UI, Impact, Playfair Display" },
        watermarkText: { type: Type.STRING, description: "Brand name watermark, e.g., VibeCut, boutique name" },
      },
      required: ["backgroundGradientStart", "backgroundGradientEnd", "textColor", "fontFamily", "watermarkText"],
    },
    scenes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          durationInFrames: { type: Type.INTEGER, description: "Duration in frames. 30 frames = 1 second. Typically 30 to 120 frames. Use short durations (15-30 frames) for high-energy fast beat edits." },
          imageIdx: { type: Type.INTEGER, description: "0-based index of the uploaded image to use, or -1 if no image." },
          textOverlay: { type: Type.STRING, description: "Text to show. Set to empty string if no text is requested." },
          textStyle: { 
            type: Type.STRING, 
            enum: ["bold-clean", "metallic-gold", "neon-glow", "glitch-red-blue", "serif-elegant"],
            description: "Visual style of text overlay."
          },
          textAnimation: { 
            type: Type.STRING, 
            enum: ["kinetic-spring", "fade", "slide-up", "zoom-in", "none"]
          },
          imageAnimation: { 
            type: Type.STRING, 
            enum: ["pan", "zoom-slow", "zoom-fast-beat", "shake-beat", "none"],
            description: "Movement of the image. Use zoom-fast-beat or shake-beat for high-energy edits like phonk."
          },
          effect: { 
            type: Type.STRING, 
            enum: ["glitch", "flash", "vignette", "film-grain", "none"],
            description: "Main screen visual effect. Use 'glitch' or 'flash' for phonk edits."
          },
          particleOverlay: { 
            type: Type.STRING, 
            enum: ["gold-flakes", "sparkles", "dust-particles", "none"]
          },
          lightLeak: { 
            type: Type.STRING, 
            enum: ["aurora", "police-flash", "gold-glow", "none"],
            description: "Atmospheric light leak. Use police-flash or aurora for energetic edits."
          },
          letterbox: { type: Type.BOOLEAN, description: "Add cinematic black bars on top and bottom." },
          border: { 
            type: Type.STRING, 
            enum: ["none", "gold-filigree", "neon-frame"]
          }
        },
        required: [
          "id", "durationInFrames", "imageIdx", "textOverlay", "textStyle", 
          "textAnimation", "imageAnimation", "effect", "particleOverlay", 
          "lightLeak", "letterbox", "border"
        ],
      }
    }
  },
  required: ["visualTheme", "scenes"]
};

function validateStoryboard(storyboard: any) {
  if (!storyboard) {
    throw new Error("Storyboard object is null or undefined");
  }
  if (!storyboard.visualTheme) {
    throw new Error("Missing 'visualTheme' object in storyboard");
  }
  const requiredTheme = ["backgroundGradientStart", "backgroundGradientEnd", "textColor", "fontFamily"];
  for (const field of requiredTheme) {
    if (!storyboard.visualTheme[field]) {
      throw new Error(`Missing required visualTheme field: '${field}'`);
    }
  }
  if (!storyboard.scenes || !Array.isArray(storyboard.scenes)) {
    throw new Error("Missing or invalid 'scenes' array in storyboard");
  }
  if (storyboard.scenes.length === 0) {
    throw new Error("Storyboard must contain at least one scene");
  }
  
  storyboard.scenes.forEach((scene: any, idx: number) => {
    if (typeof scene.id !== 'number') {
      throw new Error(`Scene at index ${idx} is missing a numeric 'id'`);
    }
    if (typeof scene.durationInFrames !== 'number' || scene.durationInFrames <= 0) {
      throw new Error(`Scene id ${scene.id} has invalid durationInFrames: ${scene.durationInFrames}`);
    }
    if (scene.durationInFrames < 10) {
      throw new Error(`Scene id ${scene.id} duration (${scene.durationInFrames} frames) is too short. Minimum duration is 10 frames.`);
    }
  });
}

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

    const contents: any[] = [];
    const initialParts: any[] = [];
    
    if (imageUrls && imageUrls.length > 0) {
      initialParts.push({
        text: `Here are the images uploaded by the user. Analyze their visual themes and structure them into the scene array using 'imageIdx' (from 0 to ${imageUrls.length - 1}).`
      });

      for (let i = 0; i < imageUrls.length; i++) {
        try {
          const imgRes = await fetch(imageUrls[i]);
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer();
            const base64Str = Buffer.from(buffer).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            initialParts.push({
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

    initialParts.push({
      text: `Create a professional, highly customized storyboard based on this user prompt: "${prompt}".
      
      Requirements:
      - Map out the exact timing, typography styles, screen effects, overlays, and transitions to build a premium video.
      - Total duration must be 6 to 15 seconds (180 to 450 frames at 30fps).`
    });

    // Enforce role-based structure for all items in contents array
    contents.push({
      role: 'user',
      parts: initialParts
    });

    console.log("Calling Gemini API with self-correcting validation loop...");
    let storyboard: any = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: `You are VibeCut's Executive Video Director AI.
Your job is to convert user requests into a detailed, modular, frame-by-frame JSON storyboard.
You must analyze the prompt style and select the appropriate modular settings to support ANY style of edit, including:
- PHONK/GLITCH EDITS: Fast cuts (15-30 frames per scene), shake-beat or zoom-fast-beat image animations, glitch or flash screen effects, police-flash or aurora light leaks, neon-glow or glitch-red-blue text styles, neon-frame borders, Montserrat/Impact fonts.
- LUXURY/EMBROIDERY SHOWCASES: Moderate timing (90 frames), zoom-slow image animation, vignette or film-grain effects, gold-flakes or sparkles particle overlays, gold-glow light leaks, metallic-gold or serif-elegant text styles, gold-filigree borders, Playfair Display font.
- RETRO/VINTAGE EDITS: Slow cuts (90-120 frames), pan image animation, film-grain effect, dust-particles overlay, aurora light leaks, bold-clean text, letterboxes.

RULES:
1. TEXT OVERLAY RULE: Only add text overlay captions if the user explicitly requests/mentions text, headings, titles, or words in their prompt. If not mentioned, set 'textOverlay' to an empty string ("") for all scenes.
2. DYNAMIC COLORS: Set visualTheme colors (backgroundGradientStart/End) to match the colors of the uploaded images. If it is a phonk edit, you can use high-contrast dark colors (like deep greens, purples, or reds).
3. FLOW & TRANSITIONS: Vary scene durations and effects to create rhythm and prevent boring static loops.`,
            responseMimeType: 'application/json',
            responseSchema: storyboardSchema,
          }
        });

        const storyboardText = response.text;
        if (!storyboardText) {
          throw new Error("Empty response from Gemini API");
        }

        storyboard = JSON.parse(storyboardText);

        // Run validation check
        validateStoryboard(storyboard);

        // Map image URLs
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

        console.log("Gemini JSON successfully validated!");
        break; // break the loop if successful!
      } catch (err: any) {
        attempts++;
        console.warn(`Storyboard validation failed (attempt ${attempts}/${maxAttempts}):`, err.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to generate a valid storyboard after ${maxAttempts} attempts: ${err.message}`);
        }
        
        // Feed the failure back into the context for correction
        contents.push({ 
          role: 'model', 
          parts: [{ text: JSON.stringify(storyboard || { error: err.message }) }] 
        });
        contents.push({ 
          role: 'user', 
          parts: [{ text: `The previous response failed validation with the following error: "${err.message}". Please regenerate the storyboard, correcting this error. Keep the response strictly conforming to the JSON schema and requirements.` }] 
        });
      }
    }

    // Trigger GitHub Action dispatch
    const githubToken = process.env.GITHUB_TOKEN;
    const repoOwner = process.env.GITHUB_REPO_OWNER;
    const repoName = process.env.GITHUB_REPO_NAME;

    if (!githubToken || !repoOwner || !repoName) {
      console.warn("GitHub configuration missing, skipping repository_dispatch.");
      return NextResponse.json({
        success: true,
        storyboard,
        generationId,
        dispatched: false
      });
    }

    console.log(`Triggering GitHub Action dispatch...`);
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
