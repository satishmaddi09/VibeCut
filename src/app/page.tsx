'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Sparkles, 
  Film, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Heart, 
  Download, 
  Loader2 
} from 'lucide-react';
import styles from './page.module.css';

interface UploadedImage {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
}

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'storyboarding' | 'rendering' | 'completed' | 'failed'>('idle');
  const [progressStep, setProgressStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  
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

      // 2. Upload images to Supabase storage
      if (images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const imageObj = images[i];
          const fileExtension = imageObj.file.name.split('.').pop();
          const fileName = `${i}_file.${fileExtension}`;
          const filePath = `generations/${genId}/inputs/${fileName}`;

          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, imageObj.file, {
              cacheControl: '3600',
              upsert: true
            });

          if (error) {
            throw new Error(`Failed to upload file ${imageObj.file.name}: ${error.message}`);
          }

          // Retrieve public url
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(filePath);

          if (!urlData || !urlData.publicUrl) {
            throw new Error(`Failed to get public URL for ${imageObj.file.name}`);
          }

          uploadedUrls.push(urlData.publicUrl);
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

      // Check if action was successfully dispatched
      if (genData.dispatched) {
        setStatus('rendering');
        setProgressStep(3);
        startPollingForVideo(genId, bucketName);
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

  // Poll Supabase Storage to check when the video compile completes
  const startPollingForVideo = (genId: string, bucketName: string) => {
    const videoPath = `generations/${genId}/output.mp4`;
    const { data } = supabase.storage.from(bucketName).getPublicUrl(videoPath);
    const publicVideoUrl = data.publicUrl;

    let attempts = 0;
    const maxAttempts = 72; // ~6 minutes maximum (72 * 5 seconds)

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      setProgressStep(4); // actively compiling

      try {
        // Make a HEAD request to verify if file exists in Supabase bucket
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

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <Film size={40} className={styles.logoIcon} />
          <h1 className={styles.title}>VibeCut</h1>
        </div>
        <p className={styles.subtitle}>Supercharge your ideas into engaging visual stories</p>
      </header>

      {/* Safety Guardrail Notice */}
      <div className={styles.guardrailCard}>
        <Sparkles size={24} className={styles.guardrailIcon} />
        <div className={styles.guardrailText}>
          <strong>🫧 Zero-Waste Ephemeral Pipeline</strong>
          To avoid cloud fees and respect your data privacy, your uploaded photos and generated video are cached on our secure servers temporarily. Leaving, refreshing, or closing this tab will trigger a complete wipe of your files instantly!
        </div>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleGenerate}>
          {/* Visual/Text Prompt */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="prompt">
              Describe your video <span className={styles.labelHint}>(theme, pace, mood)</span>
            </label>
            <textarea
              id="prompt"
              className={styles.textarea}
              placeholder="e.g. A fast-paced, high-tech journey through a cyber-city, transition with zooming effects, colorful neon signs..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={status !== 'idle' && status !== 'completed' && status !== 'failed'}
              required
            />
          </div>

          {/* Media Uploader */}
          <div className={styles.formGroup}>
            <span className={styles.label}>
              Upload photos <span className={styles.labelHint}>(Gemini will arrange them)</span>
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
                Drag & drop photos here, or <strong>browse files</strong>
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
                Creating Magic...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate AI Video ✨
              </>
            )}
          </button>
        </form>

        {/* Mascot bubble during active pipeline */}
        {status !== 'idle' && status !== 'completed' && status !== 'failed' && (
          <div className={`${styles.mascotContainer} animate-float`}>
            <div className={styles.mascotAvatar}>🤖💖</div>
            <div className={styles.mascotText}>
              {status === 'uploading' && "Uploading your beautiful pictures to our vault..."}
              {status === 'storyboarding' && "Gemini is analyzing your prompt and storyboard... We are designing layouts!"}
              {status === 'rendering' && "Remote builder is running on GitHub. Compiling and stitching the video frame-by-frame. This usually takes 2-3 mins, stay on this page! 🍿"}
            </div>
          </div>
        )}

        {/* Error Output */}
        {errorMessage && (
          <div className={styles.errorMessage}>
            <div className="flex items-center gap-2 mb-1 font-semibold">
              <AlertCircle size={18} />
              <span>Pipeline Notice</span>
            </div>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* Real-time Step Tracker */}
        {status !== 'idle' && (
          <div className={styles.trackerContainer}>
            <h3 className={styles.trackerTitle}>
              <Film size={18} /> Video Construction Progress
            </h3>
            <div className={styles.stepsList}>
              <div
                className={`${styles.stepItem} ${
                  progressStep > 1
                    ? styles.stepCompleted
                    : progressStep === 1
                    ? styles.stepActive
                    : styles.stepPending
                }`}
              >
                {progressStep > 1 ? <CheckCircle2 size={16} /> : <div className={styles.spinner} />}
                <span>1. Safely uploading asset images to temporary storage</span>
              </div>

              <div
                className={`${styles.stepItem} ${
                  progressStep > 2
                    ? styles.stepCompleted
                    : progressStep === 2
                    ? styles.stepActive
                    : styles.stepPending
                }`}
              >
                {progressStep > 2 ? <CheckCircle2 size={16} /> : progressStep === 2 ? <div className={styles.spinner} /> : null}
                <span>2. Formulating scene sequences with Gemini AI</span>
              </div>

              <div
                className={`${styles.stepItem} ${
                  progressStep > 3
                    ? styles.stepCompleted
                    : progressStep === 3
                    ? styles.stepActive
                    : styles.stepPending
                }`}
              >
                {progressStep > 3 ? <CheckCircle2 size={16} /> : progressStep === 3 ? <div className={styles.spinner} /> : null}
                <span>3. Deploying remote compiler worker (GitHub Actions)</span>
              </div>

              <div
                className={`${styles.stepItem} ${
                  progressStep > 4
                    ? styles.stepCompleted
                    : progressStep === 4
                    ? styles.stepActive
                    : styles.stepPending
                }`}
              >
                {progressStep > 4 ? <CheckCircle2 size={16} /> : progressStep === 4 ? <div className={styles.spinner} /> : null}
                <span>4. Rendering & stitching .mp4 video frames</span>
              </div>
            </div>
          </div>
        )}

        {/* Video Result View */}
        {videoUrl && (
          <div className={styles.videoResultContainer}>
            <h3 className={styles.trackerTitle} style={{ color: 'var(--accent)' }}>
              🎉 Your Video is Ready!
            </h3>
            <div className={styles.videoWrapper}>
              <video src={videoUrl} controls className={styles.videoElement} autoPlay loop />
            </div>
            
            <div className={styles.downloadRow}>
              <a href={videoUrl} download={`vibecut-${generationId}.mp4`} className={styles.downloadBtn}>
                <Download size={18} />
                Download Video File
              </a>
              <div className={styles.warningBanner}>
                ⚠️ Warning: You can download the video as many times as you like now. However, if you refresh, close the page, or click anywhere else, this video is gone from our servers forever!
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
