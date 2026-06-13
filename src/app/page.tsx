'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadFiles } from '@/utils/uploadthing';
import { 
  Sparkles, 
  Film, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Heart, 
  Download, 
  Loader2,
  Layers,
  Settings,
  Play,
  FileText,
  ChevronRight,
  RefreshCw,
  Music,
  Check
} from 'lucide-react';
import styles from './page.module.css';

interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

const TEMPLATES = [
  {
    id: 'gold-luxury',
    name: '✨ Royal Gold Filigree',
    description: 'Perfect for bridal blouses, computer maggam, and jewelry. Features gold filigree, sparkles, and emerald luxury correction.',
    prompt: 'A premium showcase for computer maggam work designs, heavy gold zardozi embroidery with diamond details, gold filigree border, royal emerald background, slow transitions, sparkling gold dust particles.',
  },
  {
    id: 'phonk-beat',
    name: '⚡ Cyber Phonk Beat Drop',
    description: 'High energy, fast beat edit with neon borders, chromatic flashes, police light leaks, and kinetic spring titles.',
    prompt: 'Fast paced Phonk edit, dark urban themes, high contrast neon cyan and magenta pulsing border, glitch text effects, chromatic aberration sweeps, rapid zoom-fast-beat transitions on beat drops.',
  },
  {
    id: 'retro-vhs',
    name: '📼 Analog VHS Camcorder',
    description: 'Nostalgic 90s look with VHS tracking line distortion, viewfinder borders, warm light leaks, and dust particles.',
    prompt: 'Retro VHS recording style video, vintage warm coloring, scanline distortion tracking effects, play time counter in courier font, warm light leaks with analog film dust particles.',
  },
  {
    id: 'floral-minimal',
    name: '🌸 Minimalist Editorial',
    description: 'Elegant slide-slow showcase with thin lines, dreamy haze light leak, and falling red/pink rose petals.',
    prompt: 'A clean editorial minimal style portfolio, thin line borders, soft dreamy pastel backglow haze, floating red rose petals, slide-slow transitions with elegant Playfair serif text overlays.',
  },
  {
    id: 'theater-showcase',
    name: '🎭 Theater Curtain Stage',
    description: 'Perfect for vlog intros. Renders parting velvet curtains, sweeping spotlights, and before-after comparisons.',
    prompt: 'A dramatic vlog intro, theater-curtains border opening at the start and closing at the end, stage-spotlight sweeping across a split-comparison layout comparing design stages, rich dark mahogany color theme.',
  },
  {
    id: 'motion-graphics',
    name: '💥 Kinetic Motion Graphic',
    description: 'Modern content style with lower-thirds, shape bursts, kinetic reveals, and bokeh particle overlays.',
    prompt: 'Premium modern motion graphics edit, border: kinetic-reveal transition bars, gold and velvet color blocks, shape-bursts gold expanding rings, bokeh-particles drifting in the background, lower-third info banner sliding in from left.',
  },
  {
    id: 'cyber-hud',
    name: '📟 Cyberpunk HUD Scanner',
    description: 'Tech scanner display with target crosshairs, neon cyan coordinates, scanlines, and prism splits.',
    prompt: 'Tech reviews layout, cyber-hud scanning overlay with glowing neon cyan coordinates and crosshairs, prism-split refractive edge clones, digital rain, cyberpunk Hacker typewriter text.',
  },
  {
    id: 'vintage-projector',
    name: '🎞️ 8mm Projector Memories',
    description: 'Nostalgic projector feel with film dust, scratches, warm drifting bokeh lights, and vintage borders.',
    prompt: 'Vintage home video memories, film-dust-scratches projector hair particles and scratches flickering, warm light-leak-warm leaks, bokeh-particles drifting, vintage-warm grading, vhs-borders.',
  },
  {
    id: 'grid-spec',
    name: '📊 Multi-Image Grid Showcase',
    description: 'Display 4 or 6 items simultaneously in a premium card grid with staggered zoom animations.',
    prompt: 'A premium catalog showcase displaying a grid of 6 different computer embroidery designs at once in a grid-6 layout, gold-filigree borders, sparkles particle overlay, bold-clean metallic-gold headers.'
  }
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [storyboard, setStoryboard] = useState<any | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'storyboarding' | 'rendering' | 'completed' | 'failed'>('idle');
  const [progressStep, setProgressStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Deletion logic on page exit
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Show warning if a generation process has started
      if (generationId && status !== 'idle' && status !== 'failed') {
        const message = "⚠️ Warning: If you leave this page, your video and uploaded assets will be permanently deleted from our servers forever! Are you sure you want to proceed?";
        e.returnValue = message;
        return message;
      }
    };

    const handleUnload = () => {
      if (generationId) {
        // Send a parting beacon to delete the folder (both inputs & video) instantly
        navigator.sendBeacon(`/api/delete-generation?generationId=${generationId}`);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [generationId, status]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle image selections
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const newImages = selectedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  // Drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files) {
      const selectedFiles = Array.from(e.dataTransfer.files);
      const newImages = selectedFiles.map(file => ({
        file,
        previewUrl: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  // End-to-end generation trigger
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setStatus('uploading');
    setProgressStep(1);
    setErrorMessage(null);
    setVideoUrl(null);

    // 1. Generate unique generation ID
    const genId = `gen-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setGenerationId(genId);

    try {
      const bucketName = 'video-generator';
      const uploadedUrls: string[] = [];

      // 2. Upload images to UploadThing
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imageObj = images[i];
          console.log(`Uploading file ${imageObj.file.name} to UploadThing...`);
          try {
            const uploadRes = await uploadFiles('imageUploader', {
              files: [imageObj.file],
              customId: `${genId}-image-${i}`,
            });
            if (!uploadRes || uploadRes.length === 0) {
              throw new Error("No response received from UploadThing");
            }
            uploadedUrls.push(uploadRes[0].url);
          } catch (err: any) {
            throw new Error(`Failed to upload file ${imageObj.file.name}: ${err.message || err}`);
          }
        }
      }

      // 3. Trigger Gemini Storyboarding & Dispatch Action
      setStatus('storyboarding');
      setProgressStep(2);

      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          imageUrls: uploadedUrls,
          generationId: genId
        })
      });

      const genData = await genRes.json();
      if (!genRes.ok || !genData.success) {
        throw new Error(genData.error || 'Failed to generate storyboard');
      }

      setStoryboard(genData.storyboard);

      // Check if action was successfully dispatched
      if (genData.dispatched) {
        setStatus('rendering');
        setProgressStep(3);
        startPollingForVideo(genId);
      } else {
        // Mock / Development warning if secrets are not yet added
        setStatus('completed');
        setProgressStep(5);
        setErrorMessage(
          "Notice: Storyboard generated successfully, but the remote GitHub Actions compilation was skipped because GITHUB_TOKEN is not configured. (Review backend console)."
        );
      }

    } catch (err: any) {
      console.error(err);
      setStatus('failed');
      setProgressStep(0);
      setErrorMessage(err.message || 'An unexpected error occurred during setup.');
    }
  };

  // Poll UploadThing CDN to check when the video compile completes
  const startPollingForVideo = (genId: string) => {
    const appId = process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID || 'zcsozj16te';
    const publicVideoUrl = `https://utfs.io/a/${appId}/${genId}-video`;

    let attempts = 0;
    const maxAttempts = 72; // ~6 minutes maximum (72 * 5 seconds)

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      setProgressStep(4); // actively compiling

      try {
        // Make a HEAD request to verify if file exists in UploadThing CDN
        const res = await fetch(publicVideoUrl, { method: 'HEAD' });
        
        if (res.ok) {
          // File is ready!
          if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
          setVideoUrl(publicVideoUrl);
          setStatus('completed');
          setProgressStep(5);
        }
      } catch (err) {
        console.log("Polling request failed, retrying...", err);
      }

      if (attempts >= maxAttempts) {
        if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
        setStatus('failed');
        setProgressStep(0);
        setErrorMessage("Rendering timed out. Please check your GitHub Actions workflow logs.");
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleDownload = async () => {
    if (!videoUrl || !generationId) return;
    setIsDownloading(true);
    try {
      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error("Failed to fetch video file from CDN");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibecut-${generationId}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      console.log(`Video downloaded. Requesting deletion of generation: ${generationId}`);
      
      // Call the deletion API immediately to clean up all files from UploadThing
      await fetch(`/api/delete-generation?generationId=${generationId}`, { method: 'POST' });
      
      // Reset state so they don't try to download it again (it's gone!)
      setVideoUrl(null);
      setStoryboard(null);
      setImages([]);
      setGenerationId(null);
      setStatus('idle');
      setProgressStep(0);
      alert("🎉 Download completed successfully! For your privacy, your files have been permanently deleted from our servers.");
    } catch (err: any) {
      console.error("Error during download/cleanup:", err);
      alert("Failed to download or clean up files: " + (err.message || err));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Film size={44} className={styles.logoIcon} />
          <h1 className={styles.title}>VibeCut <span className={styles.titleBadge}>SaaS Pro</span></h1>
        </div>
        <p className={styles.subtitle}>Supercharge your Maggam work, boutiques, & ideas into premium vertical reels</p>
      </header>

      {/* Interactive Templates Presets */}
      <section className={styles.templatesSection}>
        <div className={styles.templatesHeader}>
          <Sparkles size={18} className={styles.templatesHeaderIcon} />
          <h2>Select a Production Video Template</h2>
        </div>
        <div className={styles.templatesGrid}>
          {TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              className={`${styles.templateCard} ${selectedTemplateId === tmpl.id ? styles.templateCardActive : ''}`}
              onClick={() => {
                setSelectedTemplateId(tmpl.id);
                setPrompt(tmpl.prompt);
              }}
              disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
            >
              <div className={styles.templateCardHeader}>
                <span className={styles.templateName}>{tmpl.name}</span>
                {selectedTemplateId === tmpl.id && <span className={styles.activeCheck}><Check size={14} /> Active</span>}
              </div>
              <p className={styles.templateDescription}>{tmpl.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Two-Column Workspace */}
      <div className={styles.workspace}>
        {/* Left Column: Creator Console */}
        <section className={styles.consoleColumn}>
          <div className={styles.cardHeader}>
            <Settings size={18} className={styles.headerIcon} />
            <h2>Video Creator Console</h2>
          </div>
          
          <form onSubmit={handleGenerate} className={styles.form}>
            {/* Visual/Text Prompt */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="prompt">
                Edit Video Prompt <span className={styles.labelHint}>(Customize theme, timing or overlays)</span>
              </label>
              <textarea
                id="prompt"
                className={styles.textarea}
                placeholder="Choose a template above or type your customized video guidelines..."
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setSelectedTemplateId(null); // clear preset tag if modified manually
                }}
                disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
                required
              />
            </div>

            {/* Media Uploader */}
            <div className={styles.formGroup}>
              <span className={styles.label}>
                Upload Photos <span className={styles.labelHint}>(Gemma will organize storyboard index)</span>
              </span>

              <div
                className={`${styles.uploadArea} ${isDragActive ? styles.uploadAreaActive : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={32} className={styles.uploadIcon} />
                <p className={styles.uploadText}>
                  Drag & drop assets here, or <strong>browse files</strong>
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  style={{ display: 'none' }}
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
                />
              </div>

              {/* Selected Images Grid */}
              {images.length > 0 && (
                <div className={styles.thumbnailGrid}>
                  {images.map((img, idx) => (
                    <div key={idx} className={styles.thumbnailWrapper}>
                      <img src={img.previewUrl} alt="Thumbnail preview" className={styles.thumbnail} />
                      <button
                        type="button"
                        className={styles.removeThumbBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(idx);
                        }}
                        disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={!prompt.trim() || (status !== 'idle' && status !== 'completed' && status !== 'failed')}
            >
              {status !== 'idle' && status !== 'completed' && status !== 'failed' ? (
                <>
                  <Loader2 className={styles.spinner} size={20} />
                  Generating Storyboard...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Render AI Video ✨
                </>
              )}
            </button>
          </form>

          {/* Ephemeral Pipeline Notice */}
          <div className={styles.guardrailCard}>
            <Sparkles size={20} className={styles.guardrailIcon} />
            <div className={styles.guardrailText}>
              <strong>🫧 Privacy Guardrail</strong>
              Photos and generated MP4 files are cached temporarily. Leaving, refreshing, or closing this page will trigger an instant server-side wipe.
            </div>
          </div>
        </section>

        {/* Right Column: Output & Monitoring */}
        <section className={styles.outputColumn}>
          {/* Active Progress Tracker */}
          {status !== 'idle' && (
            <div className={styles.trackerCard}>
              <h3 className={styles.trackerTitle}>
                <RefreshCw size={18} className={styles.spinner} /> Pipeline Status
              </h3>
              <div className={styles.stepsList}>
                <div className={`${styles.stepItem} ${progressStep > 1 ? styles.stepCompleted : progressStep === 1 ? styles.stepActive : styles.stepPending}`}>
                  {progressStep > 1 ? <CheckCircle2 size={16} /> : <div className={styles.miniSpinner} />}
                  <span>Upload assets to storage</span>
                </div>

                <div className={`${styles.stepItem} ${progressStep > 2 ? styles.stepCompleted : progressStep === 2 ? styles.stepActive : styles.stepPending}`}>
                  {progressStep > 2 ? <CheckCircle2 size={16} /> : progressStep === 2 ? <div className={styles.miniSpinner} /> : null}
                  <span>Gemma Storyboard Compilation</span>
                </div>

                <div className={`${styles.stepItem} ${progressStep > 3 ? styles.stepCompleted : progressStep === 3 ? styles.stepActive : styles.stepPending}`}>
                  {progressStep > 3 ? <CheckCircle2 size={16} /> : progressStep === 3 ? <div className={styles.miniSpinner} /> : null}
                  <span>Triggering render worker</span>
                </div>

                <div className={`${styles.stepItem} ${progressStep > 4 ? styles.stepCompleted : progressStep === 4 ? styles.stepActive : styles.stepPending}`}>
                  {progressStep > 4 ? <CheckCircle2 size={16} /> : progressStep === 4 ? <div className={styles.miniSpinner} /> : null}
                  <span>Rendering video frames</span>
                </div>
              </div>
            </div>
          )}

          {/* Video Result View */}
          {videoUrl && (
            <div className={styles.videoResultCard}>
              <h3 className={styles.cardSectionTitle}>🎉 Video Ready</h3>
              <div className={styles.videoWrapper}>
                <video src={videoUrl} controls className={styles.videoElement} autoPlay loop />
              </div>
              
              <div className={styles.downloadRow}>
                <button 
                  onClick={handleDownload} 
                  disabled={isDownloading} 
                  className={styles.downloadBtn}
                  style={{ cursor: isDownloading ? 'not-allowed' : 'pointer' }}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className={styles.spinner} size={18} />
                      Downloading & Wiping Files...
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      Download & Delete from Server
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Live Storyboard preview */}
          {storyboard && (
            <div className={styles.storyboardInspector}>
              <div className={styles.inspectorHeader}>
                <Layers size={18} />
                <h3>Active Storyboard Timeline</h3>
              </div>
              <div className={styles.inspectorBody}>
                <div className={styles.inspectorMeta}>
                  <span><strong>Font:</strong> {storyboard.visualTheme?.fontFamily || 'Montserrat'}</span>
                  <span><strong>Watermark:</strong> {storyboard.visualTheme?.watermarkText || 'None'}</span>
                </div>
                <div className={styles.inspectorScenesTimeline}>
                  {storyboard.scenes?.map((scene: any, idx: number) => (
                    <div key={idx} className={styles.inspectorSceneItem}>
                      <div className={styles.sceneNumber}>
                        {scene.sceneType === 'intro' ? '🏁 Intro' : scene.sceneType === 'outro' ? '🏁 Outro' : `🎬 Scene ${idx}`}
                      </div>
                      <div className={styles.sceneSummary}>
                        {scene.textOverlay && <div className={styles.sceneText}>"{scene.textOverlay}"</div>}
                        {scene.subtitle && <div className={styles.sceneSubtitle}>"{scene.subtitle}"</div>}
                        <div className={styles.sceneMetrics}>
                          <span>⏱️ {Math.round(scene.durationInFrames / 30 * 10) / 10}s</span>
                          <span>🎨 {scene.effect}</span>
                          <span>🖼️ {scene.border}</span>
                          {scene.contactPhone && <span>📞 {scene.contactPhone}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Idle Placeholder */}
          {status === 'idle' && (
            <div className={styles.emptyOutputCard}>
              <Play size={40} className={styles.emptyIcon} />
              <h3>Awaiting Creation</h3>
              <p>Configure your prompt, upload images, and click "Render AI Video" to view compilation pipeline logs here.</p>
            </div>
          )}

          {/* Error Output */}
          {errorMessage && (
            <div className={styles.errorMessage}>
              <div className={styles.errorHeader}>
                <AlertCircle size={18} />
                <span>Console Alert</span>
              </div>
              <p>{errorMessage}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
