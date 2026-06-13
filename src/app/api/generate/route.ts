import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema, ThinkingLevel } from '@google/genai';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const storyboardSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    directorPlan: {
      type: Type.STRING,
      description: "A detailed scene-by-scene sequencing outline, detailing the layout pacing, transitions, and style decisions to satisfy the prompt."
    },
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
          rationale: {
            type: Type.STRING,
            description: "Director's thought process explaining why this layout, border, and effect are chosen for this scene."
          },
          durationInFrames: { type: Type.INTEGER, description: "Duration in frames. 30 frames = 1 second. Typically 30 to 120 frames. Use short durations (15-30 frames) for high-energy fast beat edits." },
          imageIdx: { type: Type.INTEGER, description: "Primary 0-based index of the uploaded image to use, or -1 if no image." },
          imageIndices: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Optional array of 0-based image indices for multi-image layouts (e.g. split-comparison uses 2, grid-4 uses 4, grid-6 uses 6)."
          },
          textOverlay: { type: Type.STRING, description: "Text to show. Set to empty string if no text is requested." },
          textStyle: { 
            type: Type.STRING, 
            enum: ["bold-clean", "metallic-gold", "neon-glow", "glitch-red-blue", "serif-elegant", "retro-vhs", "cyberpunk-hacker", "editorial-minimal"],
            description: "Visual style of text overlay."
          },
          textAnimation: { 
            type: Type.STRING, 
            enum: ["kinetic-spring", "fade", "slide-up", "zoom-in", "slide-left", "typewriter", "none"]
          },
          imageAnimation: { 
            type: Type.STRING, 
            enum: ["pan", "zoom-slow", "zoom-fast-beat", "shake-beat", "zoom-in-out", "slide-slow", "spin-transition", "whip-left", "whip-right", "bounce-beat", "none"],
            description: "Movement / transition of the image."
          },
          effect: { 
            type: Type.STRING, 
            enum: ["glitch", "flash", "vignette", "film-grain", "vhs-distortion", "chromatic-aberration", "radial-blur", "optical-glow", "rgb-split-beat", "lens-flare", "shine-sweep", "dream-bloom", "glass-refraction", "shake-flash-beat", "sharp-details", "stage-spotlight", "metallic-shine", "prism-split", "shape-bursts", "none"],
            description: "Main screen visual effect."
          },
          particleOverlay: { 
            type: Type.STRING, 
            enum: ["gold-flakes", "sparkles", "dust-particles", "digital-rain", "fire-embers", "gold-dust", "floating-petals", "bokeh-particles", "film-dust-scratches", "none"]
          },
          lightLeak: { 
            type: Type.STRING, 
            enum: ["aurora", "police-flash", "gold-glow", "light-leak-warm", "cyber-pulse", "film-burn-fast", "multi-runway", "prism-refraction", "dreamy-haze", "none"],
            description: "Atmospheric light leak."
          },
          letterbox: { type: Type.BOOLEAN, description: "Add cinematic black bars on top and bottom." },
          border: { 
            type: Type.STRING, 
            enum: ["none", "gold-filigree", "neon-frame", "vhs-borders", "cyber-scanner", "thin-line", "drawing-pulse", "corners-only", "ornament-lace", "theater-curtains", "cyber-hud", "lower-third", "kinetic-reveal"]
          },
          layout: {
            type: Type.STRING,
            enum: ["framed", "full-bleed", "full-width-centered", "split-comparison", "grid-4", "grid-6"],
            description: "Layout mode of the scene media frame."
          },
          colorFilter: {
            type: Type.STRING,
            enum: ["none", "teal-orange", "vintage-warm", "emerald-luxury", "noir-bw", "hdr-vibrant"],
            description: "Color correction / grading filter applied to the media."
          },
          sceneType: {
            type: Type.STRING,
            enum: ["intro", "showcase", "outro"],
            description: "Structural scene type: intro card, standard showcase, or outro CTA card."
          },
          subtitle: {
            type: Type.STRING,
            description: "Subtitle overlay text (used in intro/outro slides or lower-third titles). Use empty string if none."
          },
          contactPhone: {
            type: Type.STRING,
            description: "Contact WhatsApp/Phone number (used in outro slide). Use empty string if none."
          },
          contactCTA: {
            type: Type.STRING,
            description: "CTA description (used in outro slide, e.g. 'Order On WhatsApp'). Use empty string if none."
          },
          outroType: {
            type: Type.STRING,
            enum: ["whatsapp-contact", "social-badge", "website-link", "simple-clean", "instagram-profile", "youtube-channel", "business-card"],
            description: "Visual layout template for the outro card."
          },
          imageRotationCorrect: {
            type: Type.INTEGER,
            description: "Primary rotation angle in degrees clockwise (0, 90, 180, 270) to fix orientation of uploaded image if it is sideways/upside down."
          },
          imageZoomOverride: {
            type: Type.NUMBER,
            description: "Primary zoom/scale multiplier (e.g. 1.0 to 1.5) to crop out empty margins or center focus."
          },
          imagePositionOffset: {
            type: Type.STRING,
            description: "Primary CSS objectPosition alignment (e.g. 'center', 'top', 'bottom', 'left', 'right') to align focus (e.g. 'top' for blouse necklines)."
          },
          imageRotationCorrects: {
            type: Type.ARRAY,
            items: { type: Type.INTEGER },
            description: "Array of rotation angles in degrees clockwise (matching order of imageIndices) for multi-image layouts."
          },
          imageZoomOverrides: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Array of zoom/scale overrides (matching order of imageIndices) for multi-image layouts."
          },
          imagePositionOffsets: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Array of CSS objectPosition alignments (matching order of imageIndices) for multi-image layouts."
          }
        },
        required: [
          "id", "rationale", "durationInFrames", "imageIdx", "textOverlay", "textStyle", 
          "textAnimation", "imageAnimation", "effect", "particleOverlay", 
          "lightLeak", "letterbox", "border", "layout", "colorFilter",
          "sceneType", "outroType", "subtitle", "contactPhone", "contactCTA"
        ],
      }
    }
  },
  required: ["directorPlan", "visualTheme", "scenes"]
};

function validateStoryboard(storyboard: any) {
  if (!storyboard) {
    throw new Error("Storyboard object is null or undefined");
  }
  if (!storyboard.directorPlan) {
    throw new Error("Missing 'directorPlan' explanation in storyboard");
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
    if (!scene.rationale) {
      throw new Error(`Scene id ${scene.id} is missing its 'rationale' director explanation`);
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
          model: 'gemma-4-31b-it',
          contents: contents,
          config: {
            systemInstruction: `You are VibeCut's Executive Video Director AI.
Your job is to convert user requests and uploaded images into a detailed, modular, frame-by-frame JSON storyboard sequence.

IMAGE ANALYZING & LAYOUT RULES FOR DETAILED CRAFTS:
You are passed a set of uploaded images. You must analyze their visual features:
- Colors and palette: Set visualTheme (backgroundGradientStart and backgroundGradientEnd) to harmonize with the primary colors of the uploaded images.
- Blouse / Fine Crafts Crop and Rotation Protection: For highly detailed crafts, embroidery, bridal blouses, computer maggam work, and jewelry:
  * NEVER use \`layout: "full-bleed"\` or \`imageAnimation: "spin-transition"\` or \`imageAnimation: "shake-beat"\`. Full-bleed layout crops the blouse (which looks very bad as the neck or sleeves get cut off), and spins/shakes distort the detailed embroidery view.
  * You MUST use \`layout: "framed"\` or \`layout: "full-width-centered"\`. These layouts keep the entire blouse perfectly visible without cropping and add a blurred replica behind it as a premium ambient backdrop.
  * Select "sharp-details" or "vignette" as the main effect to keep thread and bead details extremely sharp. Avoid "optical-glow" or "dream-bloom" overlays unless a soft dream halo is explicitly requested.
  * Select luxurious styling (e.g. border: "gold-filigree" or "ornament-lace", textStyle: "metallic-gold" or "serif-elegant").
  * CRITICAL COLOR FILTER RULE: For luxury, bridal blouses, computer embroidery, computer maggam work, and fine details, you MUST set \`colorFilter: "none"\`. NO color grading filters are allowed for these, as color grading distorts the real thread, zari, and fabric colors which clients need to inspect.

- IMAGE ALIGNMENT & ORIENTATION AUTO-CORRECTION RULES:
  * You MUST visually analyze the orientation and alignment of each uploaded image. If an image is rotated sideways (e.g. vertical picture uploaded landscape-wise), you MUST set \`imageRotationCorrect\` to the correct clockwise degree (e.g. \`90\`, \`180\`, or \`270\`) to align it perfectly.
  * If an image contains a key focal point like a blouse neckline, maggam collar, or necklace that is positioned high up, set \`imagePositionOffset\` to \`"top"\` to prevent it from being cropped out. For bottom details, use \`"bottom"\`.
  * If the image contains empty black margins or blank background spacing that looks unpolished, use \`imageZoomOverride\` (e.g. \`1.1\` to \`1.4\`) to zoom/scale the image and fill the container frame nicely.
  * For multi-image layouts (like split-comparison, grid-4, grid-6), apply these adjustments on a per-cell basis using the plural array properties: \`imageRotationCorrects\`, \`imageZoomOverrides\`, and \`imagePositionOffsets\` matching the order of images in \`imageIndices\`.

INTRO PHASE RULE (Optional):
- DO NOT generate an intro scene unless the user's prompt explicitly requests an intro, welcome card, title card, intro screen, heading, or curtain reveal.
- If requested:
  * Set \`sceneType: "intro"\`.
  * Set \`textOverlay\` to the requested title or main headline (e.g. "TECH SHOWCASE").
  * Set \`subtitle\` to the requested sub-headline.
  * Set \`durationInFrames\` to 60 (2 seconds).
  * Set \`imageIdx\` to 0 or -1.

SHOWCASE PHASE (Compulsory):
- Set \`sceneType: "showcase"\`.
- Depending on the user request, you can showcase the uploaded user images in two ways:
  1. Standard Sequence: Loop through the N uploaded images one-by-one by creating separate, sequential scenes with layout: "framed" or "full-width-centered" (using \`imageIdx\` from 0 to N-1).
  2. Grid/Comparison: If the user explicitly requests a grid, comparison, gallery, list, specification, or before-after, you MUST pack multiple images into a SINGLE showcase scene by setting \`layout\` to "split-comparison", "grid-4", or "grid-6" and specifying their indexes in the \`imageIndices\` array (e.g., [0, 1, 2, 3]). Do not create separate sequential scenes for each image if they are displayed together in a grid!
- Map transitions, timings (60-90 frames for luxury showcase portfolios), borders, effects, and light leaks to match the pace. For embroidery and maggam blouses, prioritize slow animations like \`zoom-slow\` or \`none\` so the client can inspect the craftsmanship. No wild shakes or rotations!

REMOTION VIDEO ENGINE ARCHITECTURE & VIEWPORT CAPABILITIES:
- The video player runs a custom Remotion rendering engine rendering at 30 frames per second (30fps) inside a 9:16 vertical mobile viewport (1080x1920 pixels).
- You can structure visual presentation across scenes by choosing layouts:
  1. "full-bleed" (cover): The image is scaled with CSS object-fit: cover to completely fill the 1080x1920 viewport. Great for cinematic, immersive showcase cards.
  2. "framed" (default): The image is centered inside a rounded-corner frame (borderRadius: 24px, 2.5px solid border, zIndex: 4, height: 62% of viewport height). A blurred copy of the image is rendered behind it as a premium ambient backdrop.
  3. "full-width-centered" (contain): The image is rendered full-width with CSS object-fit: contain, scaling cleanly without crop.
  4. "split-comparison": Splits the center frame vertically into 50% height slices. The top half displays the first image from the imageIndices array (labeled "Before") and the bottom half displays the second image (labeled "After"). A glowing gold linear sweep separator line is animated on the divider axis.
  5. "grid-4": A 2x2 grid displaying 4 images from the imageIndices array at once. Each cell is a rounded card with a 1.5px solid border and subtle box-shadow. Cell cards animate with a staggered, spring-based micro-zoom scale transition (e.g. index 0 zooms first, followed by index 1 at frame 5, etc.) to look extremely dynamic and premium.
  6. "grid-6": A 2x3 grid displaying 6 images from the imageIndices array. Designed to maximize screen usage in the 9:16 space. Cell cards animate with a staggered zoom.

LAYOUTS & MULTI-IMAGE GRIDS:
- By default, use layout: "framed", "full-bleed" or "full-width-centered".
- If the user requests a grid, comparison, before-after, gallery, or multiple image layout, OR if there are multiple uploaded images:
  * Use layout: "split-comparison" (for 2 images). Provide imageIndices: [0, 1] or similar.
  * Use layout: "grid-4" (for 4 images). Provide imageIndices: [0, 1, 2, 3] or similar.
  * Use layout: "grid-6" (for 6 images). Provide imageIndices: [0, 1, 2, 3, 4, 5] or similar.
- CRITICAL: Even if the user uploaded fewer images than the layout requires (e.g., only 1 image uploaded but they request a 4-image grid), you MUST still output the requested layout (e.g., "grid-4" or "split-comparison") and populate the imageIndices array (e.g. [0, 0, 0, 0] or [0, 1, 2, 3]). The frontend rendering engine will automatically apply beautiful themed stock fallbacks for missing images. NEVER ignore the user's layout request!

PROMPT KEYWORD MATCHING RULES:
You must strictly match the user's prompt keywords to the schema values:
1. If the prompt mentions "curtain", "velvet", "theater", "reveal", or "intro reveal": Set border: "theater-curtains".
2. If the prompt mentions "hud", "cyberpunk", "coordinate", "bracket", "target", or "scanner": Set border: "cyber-hud".
3. If the prompt mentions "lower third", "title banner", "name plate", or "sliding banner": Set border: "lower-third".
4. If the prompt mentions "kinetic", "reveal transition", "diagonal", or "bar sweep": Set border: "kinetic-reveal".
5. If the prompt mentions "grid of 4", "4-image grid", "four laptop styles", "four images", "2x2 grid", or "quad grid": Set layout: "grid-4".
6. If the prompt mentions "grid of 6", "6-image grid", "six images", "2x3 grid": Set layout: "grid-6".
7. If the prompt mentions "comparison", "before after", "split screen", "vs", or "compare": Set layout: "split-comparison".
8. If the prompt mentions "spotlight" or "stage beam": Set effect: "stage-spotlight".
9. If the prompt mentions "metallic sweep", "reflection", or "shine": Set effect: "metallic-shine".
10. If the prompt mentions "prism", "refraction", or "rainbow edge": Set effect: "prism-split".
11. If the prompt mentions "burst", "shape pop", "sparks", or "vector ring": Set effect: "shape-bursts".
12. If the prompt mentions "bokeh" or "warm lights": Set particleOverlay: "bokeh-particles".
13. If the prompt mentions "dust", "scratch", "old film", or "projector": Set particleOverlay: "film-dust-scratches".

MULTI-SCENE SEQUENCING:
- Break down the user prompt into logical sequential scenes.
- If the prompt describes a sequence of events (e.g., "an intro with curtains, then a grid, then a HUD, ending with like and subscribe"), you MUST generate one scene for each part of the sequence.
- Do not compress multiple requested steps into a single scene. Generate a multi-scene storyboard.

OUTRO PHASE RULE (Mandatory if requested):
- CRITICAL OUTRO COUNT RULE: You MUST generate EXACTLY ONE outro scene, and it MUST be the final scene in the storyboard array. Do NOT generate multiple outro scenes or repeat them under any circumstances.
- MANDATORY OUTRO CARD GENERATION: You MUST generate an outro scene (sceneType: "outro") if the user prompt mentions: a phone number (e.g., "9502455979"), a call to action (e.g. "order", "order now", "contact us", "subscribe"), a social platform/handle (e.g. "whatsapp", "instagram", "youtube", "ig", "yt"), a website/URL, or explicitly requests an outro card/contact card. If none of these are present or requested, do not generate an outro scene.
- If requested:
  * Set \`sceneType: "outro"\`.
  * Set \`durationInFrames\` to 75 (2.5 seconds).
  * Set \`imageIdx\` to 0 or -1.
  * CRITICAL BRAND HEADLINE RULE: For the outro's \`textOverlay\` (headline), you MUST use the brand name or company name (e.g. "Jaya Ladies Tailor" or the company name from the prompt/your generated \`watermarkText\`). You MUST NEVER set the main headline \`textOverlay\` to a generic CTA verb like "ORDER NOW" or "CONTACT US" if a brand name is available or can be inferred. Generic CTA text belongs strictly inside the action button label (\`contactCTA\`)!
  * \`subtitle\` should contain the tagline describing the business (e.g., "PREMIUM COMPUTER WORK", "Bridal Blouses - Maggam Work", or "Thanks for watching!").
  * \`contactPhone\` contains the main action value. This could be a telephone number (e.g. "9502455979"), a channel handle/subscription message (e.g. "Subscribe for more!"), a profile handle (e.g. "@mychannel"), or a profile link.
  * \`contactCTA\` contains the short button label (e.g. "ORDER ON WHATSAPP", "SUBSCRIBE NOW", "Follow Us", or "Contact Us").
  * Choose the most appropriate \`outroType\` enum value based on the user's requested call to action:
    - Choose "youtube-channel" if the prompt mentions "youtube", "yt", "subscribe for more", or a video play button.
    - Choose "instagram-profile" if the prompt mentions "instagram", "ig", "@handle", or image-based social.
    - Choose "whatsapp-contact" if the prompt mentions "whatsapp", "phone", "mobile", "order on", or call numbers.
    - Choose "website-link" if the prompt mentions "website", "link", "url", "visit", "www.", or domain names.
    - Choose "social-badge" if the prompt mentions "like and subscribe", stars, ratings, reviews, or general socials.
    - Choose "business-card" if the prompt mentions "business", "company", "office", "address", or corporate info.
    - Choose "simple-clean" as the default minimalist outro layout if none of the above match.
  * CRITICAL OUTRO THEME INTEGRATION RULE: You MUST align the visual styling of the outro card with the rest of the video's theme:
    - If the video/brand is about zardozi work, ladies tailoring, embroidery, luxury bridal blouses, or fine crafts:
      * You MUST set the outro scene's \`textStyle\` to "metallic-gold" or "serif-elegant".
      * Set \`border\` to "gold-filigree" or "none" (so the elegant theme applies).
      * Set \`particleOverlay\` to "gold-flakes" or "gold-dust" (to match the screenshot's floating golden sparkles).
    - If the video/brand is about tech, gaming, or cyberpunk:
      * You MUST set the outro scene's \`textStyle\` to "neon-glow" or "cyberpunk-hacker".
      * Set \`border\` to "cyber-hud".
      * Set \`particleOverlay\` to "digital-rain" or "dust-particles".
    - Otherwise, default to "bold-clean" or "editorial-minimal" with clean borders.

STRICT TIMING & COMPATIBILITY RULES:
- Total duration must be 6 to 15 seconds (180 to 450 frames at 30fps).
- Ensure all required properties in the storyboard schema are set for every single scene.`,
            responseMimeType: 'application/json',
            responseSchema: storyboardSchema,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.HIGH
            }
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
              scene.imageUrl = imageUrls[scene.imageIdx];
            } else {
              scene.imageUrl = null;
            }

            // Map imageIndices array to full URLs
            if (scene.imageIndices && Array.isArray(scene.imageIndices) && imageUrls) {
              scene.imageUrls = scene.imageIndices
                .map((idx: number) => imageUrls[idx] || null)
                .filter((url: string | null) => url !== null);
            } else {
              // Fallback: if layout is split/grid but no imageIndices provided, slice from beginning
              if ((scene.layout === 'split-comparison' || scene.layout === 'grid-4' || scene.layout === 'grid-6') && imageUrls && imageUrls.length > 0) {
                scene.imageUrls = imageUrls.slice(0, scene.layout === 'split-comparison' ? 2 : (scene.layout === 'grid-4' ? 4 : 6));
              } else if (scene.sceneType === 'outro' && imageUrls && imageUrls.length > 0) {
                scene.imageUrls = imageUrls.slice(0, 2);
              } else {
                scene.imageUrls = scene.imageUrl ? [scene.imageUrl] : [];
              }
            }
            return scene;
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
