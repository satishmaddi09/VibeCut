import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from '@google/genai';
import ts from 'typescript';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const storyboardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    code: { 
      type: Type.STRING, 
      description: "The complete, valid, self-contained TSX React code for the VideoComposition component. It must be valid TypeScript/React and export VideoComposition. Do not wrap it in markdown code blocks." 
    },
    durationInFrames: { 
      type: Type.INTEGER, 
      description: "The total duration of the generated composition in frames (30fps)." 
    }
  },
  required: ["code", "durationInFrames"]
};

// Check generated TSX code string for syntax errors before launching rendering
function checkTypeScriptCompile(codeString: string): { success: boolean; error?: string } {
  if (!codeString.includes('export const VideoComposition') && !codeString.includes('export function VideoComposition')) {
    return { 
      success: false, 
      error: "Missing required component export: Your code must export the VideoComposition component (e.g., 'export const VideoComposition: React.FC = () => { ... }' or 'export function VideoComposition() { ... }')." 
    };
  }

  try {
    const result = ts.transpileModule(codeString, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.React,
        noEmitOnError: true,
      },
      reportDiagnostics: true,
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      const errorMsgs = result.diagnostics.map(diag => {
        const message = ts.flattenDiagnosticMessageText(diag.messageText, '\n');
        return `Syntax Error: ${message}`;
      });
      return { success: false, error: errorMsgs.join('\n') };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown transpile error" };
  }
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

    // Provide the images to Gemini
    if (imageUrls && imageUrls.length > 0) {
      initialParts.push({
        text: `Here are the public image URLs uploaded by the user:
${imageUrls.map((url: string, i: number) => `Image ${i}: ${url}`).join('\n')}

Please analyze these images (their styling, colors, and content) and reference these exact URLs directly inside your generated React code using '<Img src="URL" />' tags to render them.`
      });

      // Download and feed the binary image data to Gemini for visual analysis
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
          console.error(`Error downloading image ${imageUrls[i]} for analysis:`, err);
        }
      }
    } else {
      initialParts.push({
        text: `No photos uploaded. Please design a purely text-animated typographic video matching the visual theme.`
      });
    }

    initialParts.push({
      text: `Create the React code for a vertical video based on the user's prompt: "${prompt}".
      
      You must return a JSON response containing the "code" (tsx string) and "durationInFrames".`
    });

    contents.push({
      role: 'user',
      parts: initialParts
    });

    console.log("Calling Gemini API for React Code Generation...");
    let storyboard: any = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
            systemInstruction: `You are VibeCut's Executive Video Director and Lead Developer AI.
Your job is to generate a fully functional, self-contained Remotion React component inside a JSON response based on user prompts.

You must output a JSON object containing:
1. "code": The complete TSX code for the VideoComposition component as a single string.
2. "durationInFrames": The total duration of your composition in frames (30 frames = 1 second).

GUIDELINES FOR THE GENERATED REACT TSX CODE:
- EXPORTS: You MUST export the component: 'export const VideoComposition: React.FC = () => { ... }' or 'export function VideoComposition() { ... }'.
- IMPORTS: You can ONLY import from 'remotion', 'react', and google fonts submodules of '@remotion/google-fonts' (e.g. 'import { loadFont } from "@remotion/google-fonts/PlayfairDisplay";' or 'import { loadFont as loadMontserrat } from "@remotion/google-fonts/Montserrat";'). Do not import any stylesheets (.css), custom components, or other external packages.
- FONTS: Load Google Fonts outside the component using 'loadFont(...)'. Reference the resulting 'fontFamily' in your inline styles.
- IMAGES: You MUST hardcode the provided image URLs (e.g., '<Img src="https://..." />') directly inside your React code where appropriate. Give them proper styling (objectFit: 'contain' or 'cover', borderRadius, shadow).
- EFFECTS: Implement high-fidelity effects matching the prompt theme (Phonk edit, Retro aesthetic, Luxury showcase, etc.).
  - Phonk/Glitch edits: Include rapid Sequence cuts (e.g., 10-20 frames per image), beat-pump zoom springs, translation camera shakes (using math-based offsets or spring-loaded values), neon police-flashes, chromatic text offsets, and audio equalizer visualizers.
  - Luxury showcases: Include slow Ken Burns panning/zooms, heavy vignette gradients, letterbox overlays, floating gold foil flakes or sparkles using React mathematical animations, and gold metallic gradient text styling.
- AUDIO: Do not add any <Audio> tags or imports. Audio is handled globally.
- STYLE: Use inline styles for all components. Do not use external CSS class selectors. Keep all layouts clean, premium, and responsive.`,
            responseMimeType: 'application/json',
            responseSchema: storyboardSchema,
          }
        });

        const responseText = response.text;
        if (!responseText) {
          throw new Error("Empty response from Gemini API");
        }

        storyboard = JSON.parse(responseText);

        // Run syntax checks on the code string
        console.log(`Checking syntax of generated code (Attempt ${attempts + 1})...`);
        const compileCheck = checkTypeScriptCompile(storyboard.code);

        if (!compileCheck.success) {
          throw new Error(`TypeScript compilation check failed:\n${compileCheck.error}`);
        }

        console.log("React code compiled successfully!");
        break; // break loop on success

      } catch (err: any) {
        attempts++;
        console.warn(`Attempt ${attempts}/${maxAttempts} failed:`, err.message);
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to generate valid React code after ${maxAttempts} attempts. Error: ${err.message}`);
        }

        // Feed the compile error back to Gemini for self-correction
        contents.push({ 
          role: 'model', 
          parts: [{ text: JSON.stringify(storyboard || { error: err.message }) }] 
        });
        contents.push({ 
          role: 'user', 
          parts: [{ text: `The code you generated failed compilation with the following error:\n"${err.message}"\n\nPlease rewrite the complete VideoComposition code to correct this compile error. Remember to keep the exports, use only allowed imports, and output it in the correct JSON structure.` }] 
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
          code: storyboard.code,
          durationInFrames: storyboard.durationInFrames
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
