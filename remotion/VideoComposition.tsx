import React, { useMemo } from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  Img, 
  spring, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate,
  staticFile
} from 'remotion';

export interface SceneData {
  id: number;
  durationInFrames: number;
  imageIdx: number;
  imageUrl?: string | null;
  imageIndices?: number[];
  imageUrls?: (string | null)[];
  textOverlay: string;
  textStyle: 'bold-clean' | 'metallic-gold' | 'neon-glow' | 'glitch-red-blue' | 'serif-elegant' | 'retro-vhs' | 'cyberpunk-hacker' | 'editorial-minimal';
  textAnimation: 'kinetic-spring' | 'fade' | 'slide-up' | 'zoom-in' | 'slide-left' | 'typewriter' | 'none';
  imageAnimation: 'pan' | 'zoom-slow' | 'zoom-fast-beat' | 'shake-beat' | 'zoom-in-out' | 'slide-slow' | 'spin-transition' | 'whip-left' | 'whip-right' | 'bounce-beat' | 'none';
  effect: 'glitch' | 'flash' | 'vignette' | 'film-grain' | 'vhs-distortion' | 'chromatic-aberration' | 'radial-blur' | 'optical-glow' | 'rgb-split-beat' | 'lens-flare' | 'shine-sweep' | 'dream-bloom' | 'glass-refraction' | 'shake-flash-beat' | 'sharp-details' | 'stage-spotlight' | 'metallic-shine' | 'prism-split' | 'shape-bursts' | 'none';
  particleOverlay: 'gold-flakes' | 'sparkles' | 'dust-particles' | 'digital-rain' | 'fire-embers' | 'gold-dust' | 'floating-petals' | 'bokeh-particles' | 'film-dust-scratches' | 'none';
  lightLeak: 'aurora' | 'police-flash' | 'gold-glow' | 'light-leak-warm' | 'cyber-pulse' | 'film-burn-fast' | 'multi-runway' | 'prism-refraction' | 'dreamy-haze' | 'none';
  letterbox: boolean;
  border: 'none' | 'gold-filigree' | 'neon-frame' | 'vhs-borders' | 'cyber-scanner' | 'thin-line' | 'drawing-pulse' | 'corners-only' | 'ornament-lace' | 'theater-curtains' | 'cyber-hud' | 'lower-third' | 'kinetic-reveal';
  layout?: 'framed' | 'full-bleed' | 'full-width-centered' | 'split-comparison' | 'grid-4' | 'grid-6';
  colorFilter?: 'none' | 'teal-orange' | 'vintage-warm' | 'emerald-luxury' | 'noir-bw' | 'hdr-vibrant';
  sceneType?: 'intro' | 'showcase' | 'outro';
  outroType?: 'whatsapp-contact' | 'social-badge' | 'website-link' | 'simple-clean' | 'instagram-profile' | 'youtube-channel' | 'business-card';
  subtitle?: string;
  contactPhone?: string;
  contactCTA?: string;
  imageRotationCorrect?: number;
  imageZoomOverride?: number;
  imagePositionOffset?: string;
  imageRotationCorrects?: number[];
  imageZoomOverrides?: number[];
  imagePositionOffsets?: string[];
}

export interface VisualTheme {
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  textColor: string;
  fontFamily: string;
  watermarkText: string;
}

export interface Storyboard {
  visualTheme: VisualTheme;
  scenes: SceneData[];
}

// Helper to get safe fade range interpolation boundaries based on scene duration
const getFadeRange = (duration: number, maxFade: number) => {
  const fade = Math.min(maxFade, Math.floor(duration / 2.5));
  return [0, fade, duration - fade, duration];
};

const getSceneImagePlacement = (scene: SceneData, indexInScene: number = 0) => {
  let rotation = 0;
  let zoom = 1.0;
  let position = 'center';

  if (scene.imageRotationCorrects && Array.isArray(scene.imageRotationCorrects) && scene.imageRotationCorrects[indexInScene] !== undefined) {
    rotation = scene.imageRotationCorrects[indexInScene];
  } else if (typeof scene.imageRotationCorrect === 'number') {
    rotation = scene.imageRotationCorrect;
  }

  if (scene.imageZoomOverrides && Array.isArray(scene.imageZoomOverrides) && scene.imageZoomOverrides[indexInScene] !== undefined) {
    zoom = scene.imageZoomOverrides[indexInScene];
  } else if (typeof scene.imageZoomOverride === 'number') {
    zoom = scene.imageZoomOverride;
  }

  if (scene.imagePositionOffsets && Array.isArray(scene.imagePositionOffsets) && scene.imagePositionOffsets[indexInScene] !== undefined) {
    position = scene.imagePositionOffsets[indexInScene];
  } else if (typeof scene.imagePositionOffset === 'string') {
    position = scene.imagePositionOffset;
  }

  return { rotation, zoom, position };
};

export const defaultStoryboard: Storyboard = {
  visualTheme: {
    backgroundGradientStart: '#05050d',
    backgroundGradientEnd: '#000000',
    textColor: '#ffffff',
    fontFamily: 'Montserrat',
    watermarkText: 'VIBECUT EDITS',
  },
  scenes: [
    {
      id: 1,
      durationInFrames: 30,
      imageIdx: -1,
      textOverlay: "PHONK EDIT ENABLED ⚡",
      textStyle: 'glitch-red-blue',
      textAnimation: 'kinetic-spring',
      imageAnimation: 'shake-beat',
      effect: 'glitch',
      particleOverlay: 'none',
      lightLeak: 'police-flash',
      letterbox: false,
      border: 'neon-frame'
    },
    {
      id: 2,
      durationInFrames: 30,
      imageIdx: -1,
      textOverlay: "CRAZY BEATS 🥁",
      textStyle: 'neon-glow',
      textAnimation: 'zoom-in',
      imageAnimation: 'zoom-fast-beat',
      effect: 'flash',
      particleOverlay: 'none',
      lightLeak: 'aurora',
      letterbox: false,
      border: 'neon-frame'
    },
    {
      id: 3,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Luxury Handcrafted Work ✨",
      textStyle: 'metallic-gold',
      textAnimation: 'slide-up',
      imageAnimation: 'zoom-slow',
      effect: 'vignette',
      particleOverlay: 'gold-flakes',
      lightLeak: 'gold-glow',
      letterbox: true,
      border: 'gold-filigree'
    }
  ]
};

// ==========================================
// 1. MODULAR EFFECT & OVERLAY COMPONENTS
// ==========================================

// Cinematic letterbox bars
const Letterbox: React.FC<{ height?: number }> = ({ height = 85 }) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / 15);
  const ease = 1 - Math.pow(1 - t, 3);
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: height * ease,
        background: '#000000',
        zIndex: 18,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: height * ease,
        background: '#000000',
        zIndex: 18,
      }} />
    </>
  );
};

// Film grain
const FilmGrain: React.FC = () => {
  const frame = useCurrentFrame();
  const ox = (frame * 137) % 400;
  const oy = (frame * 251) % 400;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 11,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundPosition: `${ox}px ${oy}px`,
      backgroundSize: '256px 256px',
      opacity: 0.05,
      mixBlendMode: 'overlay',
    }} />
  );
};

// Double Border gold filigree frame
const CornerOrnament: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <svg 
    style={{
      position: 'absolute',
      width: 50, height: 50,
      zIndex: 14,
      pointerEvents: 'none',
      filter: 'drop-shadow(0 0 5px rgba(212, 175, 55, 0.8)) drop-shadow(0 2px 6px rgba(0,0,0,0.85))',
      ...style
    }} 
    viewBox="0 0 100 100"
  >
    <defs>
      <linearGradient id="goldGradFiligree" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF2A3" />
        <stop offset="30%" stopColor="#FFD700" />
        <stop offset="70%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#AA7C11" />
      </linearGradient>
    </defs>
    <path d="M 12 90 L 12 12 L 90 12" fill="none" stroke="url(#goldGradFiligree)" strokeWidth="4" strokeLinecap="round" />
    <path d="M 24 76 C 24 45, 45 24, 76 24" fill="none" stroke="url(#goldGradFiligree)" strokeWidth="1.5" strokeDasharray="2 3" />
    <circle cx="12" cy="12" r="4.5" fill="url(#goldGradFiligree)" />
    <circle cx="12" cy="90" r="3.5" fill="#FFF" />
    <circle cx="90" cy="12" r="3.5" fill="#FFF" />
  </svg>
);

const GoldFiligreeBorder: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.9 + 0.1 * Math.sin(frame * 0.08);
  return (
    <>
      <div style={{
        position: 'absolute', inset: 22,
        border: `1.5px solid rgba(212, 175, 55, ${0.35 * pulse})`,
        borderRadius: '22px',
        pointerEvents: 'none',
        zIndex: 14,
      }} />
      <div style={{
        position: 'absolute', inset: 27,
        border: `2px solid rgba(212, 175, 55, ${0.5 * pulse})`,
        borderRadius: '18px',
        boxShadow: 'inset 0 0 18px rgba(212, 175, 55, 0.12)',
        pointerEvents: 'none',
        zIndex: 14,
      }} />
      <CornerOrnament style={{ top: 27, left: 27 }} />
      <CornerOrnament style={{ top: 27, right: 27, transform: 'scaleX(-1)' }} />
      <CornerOrnament style={{ bottom: 27, left: 27, transform: 'scaleY(-1)' }} />
      <CornerOrnament style={{ bottom: 27, right: 27, transform: 'scale(-1, -1)' }} />
    </>
  );
};

// Glowing Neon Pulse Border (Cyan/Magenta alternate for Phonk)
const NeonBorder: React.FC = () => {
  const frame = useCurrentFrame();
  const isAlt = Math.floor(frame / 12) % 2 === 0;
  const color = isAlt ? '#ec4899' : '#06b6d4';
  const glow = 0.75 + 0.25 * Math.sin(frame * 0.2);
  return (
    <div style={{
      position: 'absolute', inset: 24,
      border: `3px solid ${color}`,
      borderRadius: '16px',
      boxShadow: `0 0 ${10 * glow}px ${color}, inset 0 0 ${10 * glow}px ${color}`,
      opacity: 0.8,
      pointerEvents: 'none',
      zIndex: 14,
      transition: 'border-color 0.2s ease',
    }} />
  );
};

// Thread Progress Bar
const ThreadProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  const GOLD = '#E8C97D';
  const GOLD_BRIGHT = '#FFD700';

  return (
    <div style={{
      position: 'absolute',
      bottom: 85,
      left: 56,
      right: 56,
      height: 2,
      background: 'rgba(255, 255, 255, 0.15)',
      zIndex: 19,
    }}>
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: `${progress * 100}%`,
        background: `linear-gradient(to right, ${GOLD}, ${GOLD_BRIGHT})`,
        boxShadow: `0 0 8px ${GOLD_BRIGHT}`,
      }} />
      <div style={{
        position: 'absolute',
        left: `${progress * 100}%`,
        top: -6,
        transform: 'translateX(-50%)',
        width: 14, height: 14,
        borderRadius: '50%',
        background: GOLD_BRIGHT,
        boxShadow: `0 0 12px ${GOLD_BRIGHT}, 0 0 4px #FFF`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFF' }} />
      </div>
    </div>
  );
};

// Watermark
const WatermarkOverlay: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const op = Math.min(0.6, frame / 20);
  return (
    <div style={{
      position: 'absolute',
      top: 40,
      left: 56,
      opacity: op,
      zIndex: 15,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        fontFamily: "'Segoe UI', sans-serif",
        fontWeight: 700,
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 3,
        textTransform: 'uppercase',
        textShadow: '0 1px 8px rgba(0,0,0,0.9)',
      }}>
        {text}
      </div>
      <div style={{
        marginTop: 4,
        height: 1.5,
        width: 70,
        background: 'linear-gradient(to right, rgba(232,201,125,0.6), transparent)',
      }} />
    </div>
  );
};

// Equalizer visualizer
const AudioVisualizer: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{
      position: 'absolute',
      bottom: 125,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'flex-end',
      gap: 5,
      height: 32,
      zIndex: 15,
      opacity: 0.55,
    }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const h = 6 + (Math.sin(frame * 0.35 + i * 0.45) * 0.5 + 0.5) * 22;
        return (
          <div key={i} style={{
            width: 4, height: h,
            borderRadius: '2px 2px 0 0',
            background: 'linear-gradient(to top, #FFD700, #ff758f)',
            boxShadow: '0 0 5px #ff758f',
          }} />
        );
      })}
    </div>
  );
};

// ==========================================
// 2. PARTICLE FLOATING SYSTEMS
// ==========================================

// Sparkle cross star particles
const Sparkle: React.FC<{ x: number; y: number; phase: number; size: number }> = ({ x, y, phase, size }) => {
  const frame = useCurrentFrame();
  const cycle = 50;
  const t = ((frame * 1.5 + phase) % cycle) / cycle;
  const opacity = t < 0.15 ? t / 0.15 : t < 0.6 ? 1 : (1 - t) / 0.4;
  const scale = t < 0.3 ? (1 - Math.pow(1 - t / 0.3, 4)) : 1;

  return (
    <div style={{
      position: 'absolute',
      left: x, top: y,
      width: size, height: size,
      opacity: Math.max(0, opacity),
      transform: `scale(${scale}) rotate(${t * 360}deg)`,
      pointerEvents: 'none',
      zIndex: 12,
    }}>
      {[0, 90, 45, 135].map((rot) => (
        <div key={rot} style={{
          position: 'absolute',
          left: '50%', top: '50%',
          width: size * 0.25, height: size,
          marginLeft: -size * 0.125,
          marginTop: -size / 2,
          background: 'linear-gradient(to bottom, transparent, #FFD700, transparent)',
          transform: `rotate(${rot}deg)`,
          transformOrigin: '50% 50%',
          boxShadow: '0 0 6px #FFD700',
        }} />
      ))}
    </div>
  );
};

const SparkleField: React.FC<{ count?: number }> = ({ count = 16 }) => {
  const { width, height } = useVideoConfig();
  const sparks = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: ((i * 419 + 71) % (width - 160)) + 80,
      y: ((i * 593 + 281) % (height - 500)) + 250,
      phase: i * 17.3,
      size: 5 + (i % 3) * 4,
    })),
  [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {sparks.map((s, i) => <Sparkle key={i} {...s} />)}
    </div>
  );
};

// Gold Foil Clip Paths for organic flakes
const SHAPES = [
  'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)', // Hexagon
  'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',         // Pentagon
  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',                    // Diamond
  'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',                   // Trapezoid
];

// 3D Gold Foil flakes falling down
const Flake: React.FC<{
  x: number;
  startY: number;
  speed: number;
  size: number;
  phase: number;
  rotSpeed: number;
  shapeIndex: number;
}> = ({ x, startY, speed, size, phase, rotSpeed, shapeIndex }) => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();

  const y = ((startY + frame * speed) % height + height) % height;
  const drift = Math.sin((frame * 0.02) + phase) * 22;

  const rx = (frame * rotSpeed + phase) % 360;
  const ry = (frame * (rotSpeed * 0.7) + phase * 2) % 360;
  const rz = (frame * (rotSpeed * 1.3) + phase * 3) % 360;

  const opacity = 0.4 + 0.4 * Math.sin(frame * 0.06 + phase);
  const scale = 0.8 + 0.25 * Math.sin(frame * 0.05 + phase);

  return (
    <div style={{
      position: 'absolute',
      left: x + drift,
      top: y,
      width: size, height: size,
      background: 'linear-gradient(135deg, #FFF2A3 0%, #FFD700 35%, #D4AF37 65%, #AA7C11 100%)',
      opacity,
      clipPath: SHAPES[shapeIndex],
      transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${scale})`,
      boxShadow: '0 0 6px rgba(255, 215, 0, 0.4)',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      pointerEvents: 'none',
      zIndex: 9,
    }} />
  );
};

const GoldFlakesField: React.FC<{ count?: number }> = ({ count = 22 }) => {
  const { width, height } = useVideoConfig();

  const flakes = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (i * 227 + 53) % width,
      startY: (i * 383 + 97) % height,
      speed: 0.95 + (i % 5) * 0.35,
      size: 7 + (i % 7) * 4,
      phase: i * 14.7,
      rotSpeed: 1.2 + (i % 4) * 0.7,
      shapeIndex: i % SHAPES.length,
    })),
    [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
      {flakes.map((f, i) => <Flake key={i} {...f} />)}
    </div>
  );
};

// Soft floating dust particles
const DustField: React.FC<{ count?: number }> = ({ count = 20 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i * 137 + 43) % width,
    startY: (i * 251 + 79) % height,
    speed: 0.4 + (i % 3) * 0.2,
    size: 2.5 + (i % 4) * 2,
    phase: i * 11.2,
  })), [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {particles.map((p, i) => {
        const y = ((p.startY - frame * p.speed) % height + height) % height;
        const drift = Math.sin(frame * 0.01 + p.phase) * 15;
        const opacity = 0.12 + 0.12 * Math.sin(frame * 0.05 + p.phase);
        return (
          <div key={i} style={{
            position: 'absolute', left: p.x + drift, top: y,
            width: p.size, height: p.size, borderRadius: '50%',
            backgroundColor: '#ffffff', opacity, filter: 'blur(1px)'
          }} />
        );
      })}
    </div>
  );
};

// ==========================================
// 3. ATMOSPHERIC LIGHT LEAKS
// ==========================================

// Pulsing Police flashing light leak (Magenta + Cyan flash for Phonk)
const PoliceFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const isMagenta = Math.floor(frame / 3) % 2 === 0;
  return (
    <div style={{
      position: 'absolute', inset: -10, pointerEvents: 'none', zIndex: 13,
      background: isMagenta ? 'rgba(236, 72, 153, 0.18)' : 'rgba(6, 182, 212, 0.18)',
      mixBlendMode: 'color-dodge'
    }} />
  );
};

// Slow shifting aurora light leak
const AuroraLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const driftX = Math.sin(frame * 0.025) * 60;
  const driftY = Math.cos(frame * 0.02) * 40;
  return (
    <div style={{
      position: 'absolute', inset: -120, pointerEvents: 'none', zIndex: 13,
      background: 'radial-gradient(circle at 35% 30%, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 50%, transparent 80%)',
      transform: `translate(${driftX}px, ${driftY}px) scale(1.1)`,
      mixBlendMode: 'screen'
    }} />
  );
};

// Gold atmospheric backglow
const GoldLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = 0.1 + 0.05 * Math.sin(frame * 0.025);
  return (
    <div style={{
      position: 'absolute', inset: -60, pointerEvents: 'none', zIndex: 13,
      background: 'radial-gradient(circle at 15% 25%, rgba(255, 215, 0, 0.22) 0%, transparent 75%)',
      opacity,
      mixBlendMode: 'color-dodge'
    }} />
  );
};

// Warm vintage light leak (red/orange gradient)
const WarmLightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const driftX = Math.cos(frame * 0.015) * 80;
  const driftY = Math.sin(frame * 0.02) * 50;
  const scale = 1.0 + 0.15 * Math.sin(frame * 0.01);
  return (
    <div style={{
      position: 'absolute', inset: -100, pointerEvents: 'none', zIndex: 13,
      background: 'radial-gradient(circle at 75% 80%, rgba(253, 186, 116, 0.25) 0%, rgba(239, 68, 68, 0.18) 45%, transparent 75%)',
      transform: `translate(${driftX}px, ${driftY}px) scale(${scale})`,
      mixBlendMode: 'screen',
    }} />
  );
};

// Cyber pulse light leak (cyan/magenta shifting glow)
const CyberPulseLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const glow = 0.5 + 0.5 * Math.sin(frame * 0.15);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 13,
      background: `radial-gradient(circle at 50% 50%, rgba(6, 182, 212, ${0.1 * glow}) 0%, rgba(236, 72, 153, ${0.1 * (1 - glow)}) 100%)`,
      mixBlendMode: 'color-dodge',
    }} />
  );
};

// Analog VHS Distortion tracking line
const VhsDistortion: React.FC = () => {
  const frame = useCurrentFrame();
  const trackingLineY = (frame * 6) % 1080;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
      {/* Tracking line */}
      <div style={{
        position: 'absolute',
        top: trackingLineY,
        left: 0, right: 0,
        height: 12,
        background: 'rgba(255, 255, 255, 0.15)',
        boxShadow: '0 0 10px rgba(255, 255, 255, 0.4)',
        filter: 'blur(1px)',
        opacity: (frame % 20 < 4) ? 0.8 : 0.2,
      }} />
      {/* CRT scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%)',
        backgroundSize: '100% 4px',
        opacity: 0.15,
      }} />
    </div>
  );
};

// VHS Viewfinder Borders
const VhsBorders: React.FC = () => {
  const frame = useCurrentFrame();
  const showDot = Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{
      position: 'absolute', inset: 30,
      border: '2px solid rgba(255, 255, 255, 0.2)',
      pointerEvents: 'none',
      zIndex: 14,
      fontFamily: 'Courier New, monospace',
      fontSize: 18,
      color: '#ffffff',
      textShadow: '0 1px 3px #000',
      padding: 20,
    }}>
      <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 12, height: 12, borderRadius: '50%',
          backgroundColor: '#ff0000',
          opacity: showDot ? 1 : 0.2,
        }} />
        <span>REC</span>
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <span>[|||] 100%</span>
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 20 }}>
        <span>PLAY</span>
      </div>
      <div style={{ position: 'absolute', bottom: 20, right: 20 }}>
        <span>00:00:${String(Math.floor(frame / 30)).padStart(2, '0')}</span>
      </div>
    </div>
  );
};

// Cyberpunk neon scanner & reticles
const CyberScannerBorder: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = (frame % 60) / 60;
  const scanY = progress < 0.5 ? progress * 2 * 100 : (1 - (progress - 0.5) * 2) * 100;
  return (
    <>
      <div style={{
        position: 'absolute', inset: 25,
        border: '2px solid #39ff14',
        boxShadow: '0 0 10px rgba(57, 255, 20, 0.4), inset 0 0 10px rgba(57, 255, 20, 0.4)',
        pointerEvents: 'none',
        zIndex: 14,
      }} />
      <div style={{ position: 'absolute', top: 15, left: 15, width: 30, height: 30, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', zIndex: 14 }} />
      <div style={{ position: 'absolute', top: 15, right: 15, width: 30, height: 30, borderTop: '4px solid #fff', borderRight: '4px solid #fff', zIndex: 14 }} />
      <div style={{ position: 'absolute', bottom: 15, left: 15, width: 30, height: 30, borderBottom: '4px solid #fff', borderLeft: '4px solid #fff', zIndex: 14 }} />
      <div style={{ position: 'absolute', bottom: 15, right: 15, width: 30, height: 30, borderBottom: '4px solid #fff', borderRight: '4px solid #fff', zIndex: 14 }} />
      <div style={{
        position: 'absolute',
        top: `${scanY}%`,
        left: 27, right: 27,
        height: 3,
        backgroundColor: '#39ff14',
        boxShadow: '0 0 12px #39ff14, 0 0 4px #fff',
        opacity: 0.8,
        zIndex: 14,
        pointerEvents: 'none',
      }} />
    </>
  );
};

// Digital matrix binary rain code particles
const DigitalRainField: React.FC<{ count?: number }> = ({ count = 12 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const columns = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i * (width - 100) / count) + 50,
    speed: 4 + (i % 3) * 2,
    phase: i * 7.5,
    chars: Array.from({ length: 15 }, () => Math.random() > 0.5 ? '1' : '0'),
  })), [count, width]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12, fontFamily: 'monospace', fontSize: 16, color: '#39ff14' }}>
      {columns.map((c, idx) => {
        const y = ((frame * c.speed + c.phase * 10) % (height + 300)) - 200;
        return (
          <div key={idx} style={{
            position: 'absolute', left: c.x, top: y,
            display: 'flex', flexDirection: 'column', gap: 4,
            opacity: 0.7,
            textShadow: '0 0 8px #39ff14',
          }}>
            {c.chars.map((char, ci) => (
              <span key={ci} style={{
                opacity: (ci === c.chars.length - 1) ? 1 : ci / c.chars.length,
                color: (ci === c.chars.length - 1) ? '#ffffff' : '#39ff14',
              }}>
                {char}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

// Minimalist thin-line border
const ThinLineBorder: React.FC = () => {
  return (
    <div style={{
      position: 'absolute', inset: 40,
      border: '1px solid rgba(255, 255, 255, 0.25)',
      pointerEvents: 'none',
      zIndex: 14,
    }} />
  );
};

// Typewriter text animation component
const TypewriterText: React.FC<{ text: string; font: string; style: React.CSSProperties }> = ({ text, font, style }) => {
  const frame = useCurrentFrame();
  const charsToShow = Math.floor(frame / 1.5);
  const visibleText = text.substring(0, charsToShow);
  const showCursor = Math.floor(frame / 6) % 2 === 0;

  return (
    <div style={{
      position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
      fontFamily: font,
      textAlign: 'center',
      ...style
    }}>
      {visibleText}
      {showCursor && <span style={{ color: style.color || '#fff' }}>|</span>}
    </div>
  );
};

// Fire embers rising up
const FireEmbersField: React.FC<{ count?: number }> = ({ count = 20 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const embers = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (i * (width - 100) / count) + 50,
    startY: height + 50,
    speed: 2.5 + (i % 3) * 1.0,
    size: 3 + (i % 4) * 2.5,
    phase: i * 8.7,
  })), [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
      {embers.map((e, idx) => {
        const y = e.startY - ((frame * e.speed + e.phase * 5) % (height + 150));
        const drift = Math.sin(frame * 0.05 + e.phase) * 20;
        const opacity = 0.4 + 0.5 * Math.sin(frame * 0.04 + e.phase);
        return (
          <div key={idx} style={{
            position: 'absolute', left: e.x + drift, top: y,
            width: e.size, height: e.size,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #ff9f43, #ee5253)',
            boxShadow: '0 0 10px #ff9f43, 0 0 4px #ee5253',
            opacity,
          }} />
        );
      })}
    </div>
  );
};

// Film Burn light leak
const FilmBurnLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const op = (frame % 8 < 3) ? 0.35 : (frame % 8 < 6 ? 0.15 : 0.05);
  const hue = (frame * 65) % 360;
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 13,
      background: `radial-gradient(circle at ${40 + Math.sin(frame) * 20}% ${50 + Math.cos(frame * 0.5) * 20}%, hsla(${hue}, 100%, 60%, ${op}) 0%, transparent 80%)`,
      mixBlendMode: 'screen',
    }} />
  );
};

// Lens Flare overlay (Anamorphic sweep)
const LensFlare: React.FC = () => {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const cycle = 150;
  const t = (frame % cycle) / cycle;
  const y = interpolate(t, [0, 1], [-150, height + 150]);
  const opacity = Math.sin(t * Math.PI) * 0.4;

  return (
    <div style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: y,
      height: 100,
      transform: "translateY(-50%)",
      background: "radial-gradient(ellipse at center, rgba(232, 201, 125, 0.22) 0%, rgba(232, 201, 125, 0.04) 20%, transparent 65%)",
      mixBlendMode: "screen",
      pointerEvents: "none",
      zIndex: 14,
      opacity: Math.max(0, opacity),
    }}>
      <div style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        height: 2,
        transform: "translateY(-50%)",
        background: "linear-gradient(to right, transparent, rgba(255, 215, 0, 0.45), rgba(255, 255, 255, 0.8), rgba(255, 215, 0, 0.45), transparent)",
      }} />
    </div>
  );
};

// --- Custom Overlays, Effects, and Particles ---

// SVG border that draws itself, with a running neon golden pulse
const DrawingBorder: React.FC<{ startFrame?: number; thickness?: number; color?: string; glowSize?: number }> = ({
  startFrame = 0,
  thickness = 3.5,
  color = '#D4AF37',
  glowSize = 22,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const t = Math.min(1, Math.max(0, (frame - startFrame) / 40));
  const easy = 1 - Math.pow(1 - t, 4); // easeOutQuart

  const perimeter = (width + height) * 2;
  const drawn = perimeter * easy;

  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 11 }} viewBox={`0 0 ${width} ${height}`}>
      <rect
        x={thickness / 2}
        y={thickness / 2}
        width={width - thickness}
        height={height - thickness}
        fill="none"
        stroke={color}
        strokeWidth={thickness}
        strokeDasharray={perimeter}
        strokeDashoffset={perimeter - drawn}
        style={{ opacity: 0.85, filter: `drop-shadow(0 0 ${glowSize}px ${color})` }}
      />
      {easy > 0.99 && (
        <rect
          x={thickness / 2}
          y={thickness / 2}
          width={width - thickness}
          height={height - thickness}
          fill="none"
          stroke="#FFD700"
          strokeWidth={thickness * 1.5}
          strokeDasharray="150, 1000"
          strokeDashoffset={frame * -12}
          style={{ filter: `drop-shadow(0 0 ${glowSize * 1.2}px #FFD700)` }}
        />
      )}
    </svg>
  );
};

// Modern corner ornaments
const ModernCornerOrnament: React.FC<{ corner: 'tl' | 'tr' | 'bl' | 'br'; size?: number; opacity?: number }> = ({
  corner,
  size = 60,
  opacity = 1,
}) => {
  const { width, height } = useVideoConfig();
  const transforms = {
    tl: "translate(0, 0)",
    tr: `translate(${width}, 0) scaleX(-1)`,
    bl: `translate(0, ${height}) scaleY(-1)`,
    br: `translate(${width}, ${height}) scale(-1, -1)`,
  };
  const GOLD = "#D4AF37";
  return (
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity }} viewBox={`0 0 ${width} ${height}`}>
      <g transform={transforms[corner]}>
        <path
          d={`M ${size} 10 L 10 10 L 10 ${size}`}
          fill="none"
          stroke={GOLD}
          strokeWidth={3}
          style={{ filter: `drop-shadow(0 0 6px ${GOLD})` }}
        />
        <circle cx={10} cy={10} r={4} fill={GOLD} style={{ filter: `drop-shadow(0 0 8px ${GOLD})` }} />
      </g>
    </svg>
  );
};

const ModernCorners: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  return (
    <>
      {(['tl', 'tr', 'bl', 'br'] as const).map(c => (
        <ModernCornerOrnament key={c} corner={c} opacity={opacity} />
      ))}
    </>
  );
};

// Ornate Gold Lace Border
const OrnateLaceBorder: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.9 + 0.1 * Math.sin(frame * 0.06);
  const GOLD = "#D4AF37";
  return (
    <div style={{
      position: 'absolute', inset: 24,
      border: `2px solid ${GOLD}`,
      borderRadius: '20px',
      boxShadow: `inset 0 0 30px rgba(212,175,55,${0.3 * pulse}), 0 0 15px rgba(212,175,55,${0.2 * pulse})`,
      pointerEvents: 'none',
      zIndex: 14,
    }}>
      <div style={{ position: 'absolute', top: 6, left: 6, width: 25, height: 25, borderTop: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}`, borderRadius: '4px 0 0 0' }} />
      <div style={{ position: 'absolute', top: 6, right: 6, width: 25, height: 25, borderTop: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}`, borderRadius: '0 4px 0 0' }} />
      <div style={{ position: 'absolute', bottom: 6, left: 6, width: 25, height: 25, borderBottom: `2px solid ${GOLD}`, borderLeft: `2px solid ${GOLD}`, borderRadius: '0 0 0 4px' }} />
      <div style={{ position: 'absolute', bottom: 6, right: 6, width: 25, height: 25, borderBottom: `2px solid ${GOLD}`, borderRight: `2px solid ${GOLD}`, borderRadius: '0 0 4px 0' }} />
      <div style={{
        position: 'absolute', inset: 4,
        border: '1.5px dashed rgba(212, 175, 55, 0.65)',
        borderRadius: '16px',
      }} />
    </div>
  );
};

// Warm Multi-layered Light Leak
const MultiRunwayLightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const leaks = useMemo(() => [
    { color: "rgba(255, 170, 50, 0.12)", baseSize: 500, speedX: 0.8, speedY: 0.5, phase: 0 },
    { color: "rgba(212, 175, 55, 0.08)", baseSize: 700, speedX: -0.5, speedY: 0.9, phase: 100 },
    { color: "rgba(255, 100, 100, 0.06)", baseSize: 600, speedX: 0.6, speedY: -0.7, phase: 200 },
  ], []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 13 }}>
      {leaks.map((leak, i) => {
        const x = (Math.sin(frame * 0.01 * leak.speedX + leak.phase) * 0.3 + 0.5) * width;
        const y = (Math.cos(frame * 0.01 * leak.speedY + leak.phase) * 0.3 + 0.5) * height;
        const size = leak.baseSize + Math.sin(frame * 0.02 + leak.phase) * 100;
        const opacity = 0.5 + 0.5 * Math.sin(frame * 0.015 + leak.phase);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${leak.color} 0%, transparent 70%)`,
              opacity: opacity,
              mixBlendMode: "screen",
            }}
          />
        );
      })}
    </div>
  );
};

// Rainbow chromatic light refraction
const PrismRefraction: React.FC = () => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const xOffset = interpolate(frame % 240, [0, 240], [-width * 0.5, width * 1.5]);
  const rot = Math.sin(frame * 0.005) * 20;

  return (
    <div style={{
      position: 'absolute', inset: -100, pointerEvents: 'none', zIndex: 13,
      background: `linear-gradient(135deg, rgba(255,0,0,0.08) 0%, rgba(255,154,0,0.08) 10%, rgba(208,222,33,0.08) 20%, rgba(79,220,74,0.08) 30%, rgba(63,218,216,0.08) 40%, rgba(47,76,229,0.08) 50%, rgba(135,42,229,0.08) 60%, transparent 80%)`,
      transform: `translateX(${xOffset}px) rotate(${rot}deg)`,
      mixBlendMode: 'screen',
      filter: 'blur(35px)',
    }} />
  );
};

// Soft luxury pastel cloud glow
const DreamyHaze: React.FC = () => {
  const frame = useCurrentFrame();
  const op = 0.5 + 0.3 * Math.sin(frame * 0.03);
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 13,
      background: 'radial-gradient(circle at 80% 20%, rgba(236,72,153,0.15) 0%, rgba(168,85,247,0.15) 40%, rgba(251,191,36,0.08) 80%, transparent 100%)',
      opacity: op,
      mixBlendMode: 'color-dodge',
    }} />
  );
};

// Skewed Golden sweep
const ShineSweep: React.FC<{ startFrame?: number }> = ({ startFrame = 0 }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const t = Math.min(1, Math.max(0, (frame - startFrame) / 35));
  const x = interpolate(t, [0, 1], [-350, width + 350]);

  return (
    <div style={{
      position: "absolute",
      inset: 0,
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: 14,
    }}>
      <div style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: x,
        width: 250,
        background: `linear-gradient(105deg, transparent 0%, rgba(255,215,0,0.18) 50%, transparent 100%)`,
        transform: "skewX(-15deg)",
      }} />
    </div>
  );
};

// Ribbed glassmorphic refractions overlay
const GlassRefraction: React.FC = () => {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12,
      backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 4px, transparent 4px, transparent 24px)',
      backdropFilter: 'blur(1.5px) saturate(110%)',
      boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05)',
    }} />
  );
};

// Floating gold dust particles
const GoldDustField: React.FC<{ count?: number }> = ({ count = 35 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const particles = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (i * 277 + 50) % width,
      startY: (i * 431 + 100) % height,
      speed: 0.35 + (i % 7) * 0.12,
      size: 1.5 + (i % 4) * 0.8,
      opacity: 0.35 + (i % 5) * 0.12,
      phase: i * 47,
    })),
  [count, width, height]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 12 }}>
      {particles.map((p, i) => {
        const y = ((p.startY - frame * p.speed + p.phase) % height + height) % height;
        const drift = Math.sin((frame * 0.02) + p.phase) * 15;
        return (
          <div key={i} style={{
            position: "absolute",
            left: p.x + drift,
            top: y,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            background: '#FFD700',
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 3}px #D4AF37`,
          }} />
        );
      })}
    </div>
  );
};

// Floating red/pink rose petals
const FloatingPetalsField: React.FC<{ count?: number }> = ({ count = 15 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  const petals = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (i * 197 + 83) % width,
      startY: (i * 311 + 47) % height,
      speed: 0.6 + (i % 5) * 0.25,
      size: 8 + (i % 6) * 4,
      opacity: 0.45 + (i % 4) * 0.1,
      phase: i * 29,
      rotSpeed: 0.8 + (i % 3) * 0.4,
    })),
  [count, width, height]);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 12 }}>
      {petals.map((p, i) => {
        const y = ((p.startY + frame * p.speed) % (height + 50)) - 25;
        const drift = Math.sin((frame * 0.015) + p.phase) * 25;
        const rot = frame * p.rotSpeed + p.phase;
        
        return (
          <div key={i} style={{
            position: "absolute",
            left: p.x + drift,
            top: y,
            width: p.size,
            height: p.size * 1.3,
            borderRadius: "50% 10% 50% 50%",
            background: 'linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)',
            opacity: p.opacity,
            transform: `rotate(${rot}deg) rotateX(${rot * 0.5}deg)`,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
          }} />
        );
      })}
    </div>
  );
};

// ==========================================
// 4. TEXT STYLING WORKER
// ==========================================

// 3D Spring kinetic text (metallic gold)
const PremiumKineticText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");
  const GOLD_METALLIC = 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)';

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '0.22em',
      position: 'absolute',
      left: 56, right: 56,
      bottom: '18%',
      zIndex: 15,
      textAlign: 'center',
    }}>
      {words.map((word, wi) => {
        const wordDelay = delay + wi * 3.5;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 9, stiffness: 90, mass: 0.8 },
        });

        const scale = 0.85 + 0.15 * progress;
        const translateY = (1 - progress) * 20;

        return (
          <span
            key={wi}
            style={{
              display: 'inline-block',
              transform: `scale(${scale}) translateY(${translateY}px)`,
              opacity: progress,
              fontSize: '54px',
              fontFamily: "'Segoe UI', sans-serif",
              background: GOLD_METALLIC,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.95))',
              fontWeight: 900,
              textTransform: 'uppercase',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// Glitch chromatic text overlay
const GlitchText: React.FC<{ text: string; font: string }> = ({ text, font }) => {
  const frame = useCurrentFrame();
  const offset = frame % 5 === 0 ? Math.sin(frame * 2) * 5 : 0;
  return (
    <div style={{
      position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
      fontFamily: font, fontSize: '58px', fontWeight: 900, textTransform: 'uppercase',
      textAlign: 'center', color: '#ffffff', textShadow: '0 4px 12px rgba(0,0,0,0.9)'
    }}>
      {offset !== 0 && (
        <span style={{ position: 'absolute', left: offset, top: 0, color: '#06b6d4', opacity: 0.75, zIndex: -1, width: '100%' }}>
          {text}
        </span>
      )}
      {offset !== 0 && (
        <span style={{ position: 'absolute', left: -offset, top: 0, color: '#ec4899', opacity: 0.75, zIndex: -1, width: '100%' }}>
          {text}
        </span>
      )}
      {text}
    </div>
  );
};

// Neon Glow Text
const NeonGlowText: React.FC<{ text: string; font: string; color: string }> = ({ text, font, color }) => {
  const frame = useCurrentFrame();
  const glow = 0.6 + 0.4 * Math.abs(Math.sin(frame * 0.15));
  const shadowColor = color === '#ffffff' ? '#ec4899' : color;
  return (
    <h1 style={{
      position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
      fontFamily: font, fontSize: '54px', fontWeight: 900, textTransform: 'uppercase',
      textAlign: 'center', color: '#ffffff',
      textShadow: `0 0 ${6 * glow}px ${shadowColor}, 0 0 ${15 * glow}px ${shadowColor}, 0 4px 12px rgba(0,0,0,0.85)`
    }}>
      {text}
    </h1>
  );
};

// --- Dedicated Intro & Outro Templates ---

const DynamicBlurredBackground: React.FC<{ 
  src: string;
  rotation?: number;
  zoom?: number;
  position?: string;
}> = ({ src, rotation = 0, zoom = 1, position = 'center' }) => {
  return (
    <div style={{
      position: "absolute",
      inset: -30,
      filter: "blur(38px) brightness(0.14) saturate(1.1)",
      transform: `scale(1.12) rotate(${rotation}deg) scale(${zoom})`,
      zIndex: 1,
    }}>
      <Img src={src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: position }} />
    </div>
  );
};

const IntroSlide: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 12, stiffness: 60 } });
  const GOLD_METALLIC = 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)';

  return (
    <AbsoluteFill style={{ background: "#000805", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {scene.imageUrl && (
        <DynamicBlurredBackground 
          src={scene.imageUrl} 
          rotation={scene.imageRotationCorrect}
          zoom={scene.imageZoomOverride}
          position={scene.imagePositionOffset}
        />
      )}
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.94) 100%)",
      }} />

      <div style={{ zIndex: 10, textAlign: "center", padding: "0 40px", transform: `scale(${0.9 + 0.1 * reveal})`, opacity: reveal }}>
        <div style={{
          fontFamily: theme.fontFamily || 'sans-serif',
          fontSize: 70,
          fontWeight: 900,
          color: '#FFD700',
          letterSpacing: 6,
          background: GOLD_METALLIC,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.95))",
          textTransform: 'uppercase',
          lineHeight: 1.15,
        }}>
          {scene.textOverlay || "WELCOME"}
        </div>

        <div style={{
          width: 320, height: 3.5,
          background: GOLD_METALLIC,
          boxShadow: `0 0 12px #FFD700`,
          margin: "24px auto"
        }} />

        {scene.subtitle && (
          <div style={{
            fontFamily: theme.fontFamily || 'sans-serif',
            fontSize: 28,
            color: "#FFF",
            letterSpacing: 7,
            textTransform: "uppercase",
            textShadow: "0 2px 8px rgba(0,0,0,0.9)",
          }}>
            {scene.subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

const OutroSlide: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = spring({ frame, fps, config: { damping: 13, stiffness: 50, mass: 0.95 } });
  const text1In = spring({ frame: frame - 8, fps, config: { damping: 12, stiffness: 65 } });
  const dividerIn = spring({ frame: frame - 15, fps, config: { damping: 10, stiffness: 75 } });
  const text2In = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 60 } });
  const waBoxIn = spring({ frame: frame - 26, fps, config: { damping: 12, stiffness: 50 } });

  const pulse = 0.94 + 0.06 * Math.sin(frame * 0.1);
  const GOLD_METALLIC = 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)';
  
  const phoneNum = scene.contactPhone || "";
  const ctaText = scene.contactCTA || "Visit Us";
  const outroType = scene.outroType || "simple-clean";

  // Card Visual Theme styling based on scene.textStyle
  const textStyle = scene.textStyle || "bold-clean";

  let accentColor = "#FFFFFF";
  let boxBg = "rgba(10, 10, 10, 0.86)";
  let borderGrad = "rgba(255, 255, 255, 0.3)";
  
  let iconSvg = (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
  
  let dividerElement = (
    <div style={{
      width: 400 * dividerIn,
      height: 2,
      background: "#FFFFFF",
      boxShadow: "0 0 10px #FFFFFF",
      margin: "30px 0",
      opacity: dividerIn,
    }} />
  );

  const isGoldTheme = textStyle === "metallic-gold" || textStyle === "serif-elegant";
  const isCyberTheme = textStyle === "neon-glow" || textStyle === "glitch-red-blue" || textStyle === "cyberpunk-hacker";

  let crestTransform = `scale(${cardIn})`;
  let titleFont = theme.fontFamily || 'sans-serif';
  let titleStyle: React.CSSProperties = {};
  let subtitleStyle: React.CSSProperties = {
    color: "#FFF",
    letterSpacing: 5,
    textTransform: "uppercase",
  };

  if (isGoldTheme) {
    accentColor = "#D4AF37"; // Gold
    boxBg = "rgba(12, 7, 3, 0.88)"; // Warm luxury dark bronze
    borderGrad = "rgba(212, 175, 55, 0.45)";
    titleFont = "'Playfair Display', Georgia, serif";
    crestTransform = `scale(${cardIn}) rotate(${frame * 0.15}deg)`;
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" style={{ filter: 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.8))' }}>
        <defs>
          <linearGradient id="goldGradCrest" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2A3" />
            <stop offset="30%" stopColor="#FFD700" />
            <stop offset="70%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#AA7C11" />
          </linearGradient>
        </defs>
        {/* Outer octagram / star polygon */}
        <path d="M 50 2 L 64 36 L 98 50 L 64 64 L 50 98 L 36 64 L 2 50 L 36 36 Z" stroke="url(#goldGradCrest)" strokeWidth={2} />
        <path d="M 50 14 L 60 40 L 86 50 L 60 60 L 50 86 L 40 60 L 14 50 L 40 40 Z" stroke="url(#goldGradCrest)" strokeWidth={1} style={{ opacity: 0.6 }} />
        {/* Central circular layers */}
        <circle cx={50} cy={50} r={18} stroke="url(#goldGradCrest)" strokeWidth={2.5} />
        <circle cx={50} cy={50} r={12} stroke="#FF1744" strokeWidth={1.5} />
        <circle cx={50} cy={50} r={6} fill="url(#goldGradCrest)" />
        {/* Pearls at points */}
        <circle cx={50} cy={2} r={2.5} fill="#FFF" />
        <circle cx={98} cy={50} r={2.5} fill="#FFF" />
        <circle cx={50} cy={98} r={2.5} fill="#FFF" />
        <circle cx={2} cy={50} r={2.5} fill="#FFF" />
      </svg>
    );

    dividerElement = (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        margin: "30px 0",
        opacity: dividerIn,
        transform: `scaleX(${dividerIn})`,
      }}>
        <div style={{ width: 140, height: 1, background: "linear-gradient(to right, transparent, #D4AF37)" }} />
        <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: "#D4AF37" }} />
        <div style={{ width: 8, height: 8, transform: "rotate(45deg)", background: "#FFD700", boxShadow: "0 0 6px #FFD700" }} />
        <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: "#D4AF37" }} />
        <div style={{ width: 140, height: 1, background: "linear-gradient(to left, transparent, #D4AF37)" }} />
      </div>
    );

    titleStyle = {
      backgroundImage: GOLD_METALLIC,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      fontStyle: textStyle === "serif-elegant" ? 'italic' : 'normal',
      fontWeight: textStyle === "serif-elegant" ? 300 : 'bold',
    };

    subtitleStyle = {
      color: "rgba(255, 255, 255, 0.95)",
      letterSpacing: 4,
      fontStyle: textStyle === "serif-elegant" ? 'italic' : 'normal',
      textTransform: "uppercase",
    };

  } else if (textStyle === "cyberpunk-hacker" || textStyle === "neon-glow") {
    accentColor = textStyle === "cyberpunk-hacker" ? "#39ff14" : "#00f0ff"; // Green or Cyan
    boxBg = "rgba(2, 6, 12, 0.9)"; // Cyber dark blue-black
    borderGrad = textStyle === "cyberpunk-hacker" ? "rgba(57, 255, 20, 0.45)" : "rgba(0, 240, 255, 0.45)";
    titleFont = "monospace";
    crestTransform = `scale(${cardIn}) rotate(${frame * -0.2}deg)`;
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 10px ${accentColor})` }}>
        <circle cx="50" cy="50" r="35" fill="none" stroke={accentColor} strokeWidth="2" strokeDasharray="10 6" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="#ff007f" strokeWidth="1.5" />
        <path d="M 50 5 L 50 20 M 50 80 L 50 95 M 5 50 L 20 50 M 80 50 L 95 50" stroke={accentColor} strokeWidth="2" />
      </svg>
    );

    dividerElement = (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        margin: "30px 0",
        opacity: dividerIn,
        transform: `scaleX(${dividerIn})`,
      }}>
        <div style={{ width: 140, height: 2, background: "linear-gradient(to right, transparent, #ff007f)" }} />
        <div style={{ width: 16, height: 6, background: accentColor, boxShadow: `0 0 8px ${accentColor}`, borderRadius: 2 }} />
        <div style={{ width: 140, height: 2, background: "linear-gradient(to left, transparent, #ff007f)" }} />
      </div>
    );

    titleStyle = {
      color: accentColor,
      textShadow: `0 0 10px ${accentColor}`,
    };

    subtitleStyle = {
      color: "#FFF",
      fontFamily: "monospace",
      letterSpacing: 3,
      textShadow: `0 0 6px ${accentColor}88`,
      textTransform: "uppercase",
    };

  } else if (textStyle === "retro-vhs") {
    accentColor = "#FFFFFF";
    boxBg = "rgba(8, 10, 16, 0.88)"; // VHS deep blue-black
    borderGrad = "rgba(255, 255, 255, 0.25)";
    titleFont = "Courier New, monospace";
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
        <circle cx="18" cy="10" r="1.5" fill="#FFF" />
      </svg>
    );

    dividerElement = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '30px 0', opacity: dividerIn }}>
        <div style={{ width: 120, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' }} />
        <span style={{ fontFamily: 'Courier New, monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>[TRACKING]</span>
        <div style={{ width: 120, height: 1, backgroundColor: 'rgba(255,255,255,0.4)' }} />
      </div>
    );

    titleStyle = {
      color: "#FFFFFF",
      textShadow: '3px 3px #06b6d4, -3px -3px #eab308, 0 4px 10px rgba(0,0,0,0.9)',
    };

    subtitleStyle = {
      color: "rgba(255,255,255,0.9)",
      fontFamily: "Courier New, monospace",
      letterSpacing: 6,
      textTransform: "uppercase",
    };

  } else if (textStyle === "glitch-red-blue") {
    accentColor = "#00f0ff";
    boxBg = "rgba(10, 2, 4, 0.9)"; // Deep red-black
    borderGrad = "rgba(236, 72, 153, 0.6)"; // Neon pink glow
    titleFont = theme.fontFamily || 'sans-serif';
    crestTransform = `scale(${cardIn}) translate(${Math.sin(frame) * 2}px, ${Math.cos(frame * 1.5) * 2}px)`;
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ filter: 'drop-shadow(3px 0px 0px rgba(255,0,60,0.85)) drop-shadow(-3px 0px 0px rgba(0,240,255,0.85))' }}>
        <polygon points="50,12 90,82 10,82" fill="none" stroke="#FFF" strokeWidth="4.5" />
        <polygon points="50,28 78,78 22,78" fill="none" stroke="#FFF" strokeWidth="2" strokeDasharray="5 5" />
      </svg>
    );

    dividerElement = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '30px 0', opacity: dividerIn }}>
        <div style={{ width: 120, height: 3, backgroundColor: '#ff003c', boxShadow: '0 0 8px #ff003c' }} />
        <span style={{ fontSize: 14, fontWeight: 900, color: '#00f0ff', textShadow: '2px 0 #ff003c, -2px 0 #00f0ff', letterSpacing: 2 }}>// ERROR //</span>
        <div style={{ width: 120, height: 3, backgroundColor: '#00f0ff', boxShadow: '0 0 8px #00f0ff' }} />
      </div>
    );

    titleStyle = {
      color: "#FFFFFF",
      textShadow: '3px 0 #ff003c, -3px 0 #00f0ff, 0 4px 10px rgba(0,0,0,0.9)',
    };

    subtitleStyle = {
      color: "#00f0ff",
      letterSpacing: 4,
      textShadow: '1px 0 #ff003c, -1px 0 #00f0ff',
      textTransform: "uppercase",
    };

  } else if (textStyle === "editorial-minimal") {
    accentColor = "#FFFFFF";
    boxBg = "rgba(15, 15, 15, 0.82)"; // Sleek translucent dark card
    borderGrad = "rgba(255, 255, 255, 0.15)";
    titleFont = theme.fontFamily || 'sans-serif';
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ opacity: 0.85 }}>
        <circle cx="50" cy="50" r="28" fill="none" stroke="#FFF" strokeWidth="1.5" />
        <circle cx="50" cy="50" r="4" fill="#FFF" />
      </svg>
    );

    dividerElement = (
      <div style={{ width: 220, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', margin: '35px 0', opacity: dividerIn }} />
    );

    titleStyle = {
      fontWeight: 300,
      letterSpacing: 8,
    };

    subtitleStyle = {
      color: "rgba(255, 255, 255, 0.7)",
      letterSpacing: 6,
      fontSize: 18,
      fontWeight: 300,
      textTransform: "uppercase",
    };

  } else {
    // Default bold-clean
    accentColor = theme.textColor || "#FFFFFF";
    boxBg = "rgba(10, 10, 10, 0.86)";
    borderGrad = "rgba(255, 255, 255, 0.3)";
    titleFont = theme.fontFamily || 'sans-serif';
    
    iconSvg = (
      <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    );
    
    dividerElement = (
      <div style={{
        width: 320 * dividerIn,
        height: 2,
        background: accentColor,
        boxShadow: `0 0 10px ${accentColor}44`,
        margin: "30px 0",
        opacity: dividerIn,
      }} />
    );

    titleStyle = {
      fontWeight: 900,
      letterSpacing: 3,
    };

    subtitleStyle = {
      color: "#FFF",
      letterSpacing: 5,
      textTransform: "uppercase",
    };
  }

  // CTA Button Specific Branding (independent of card theme)
  let ctaAccentColor = "#D4AF37";
  let ctaBoxBg = "rgba(212, 175, 55, 0.1)";
  let ctaBorderColor = "#D4AF37";
  let buttonIcon = null;

  if (outroType === "whatsapp-contact") {
    ctaAccentColor = "#25D366"; // WhatsApp green
    ctaBoxBg = "rgba(37, 211, 102, 0.08)";
    ctaBorderColor = "#25D366";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#25D366" style={{ marginRight: 8 }}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    );
  } else if (outroType === "instagram-profile") {
    ctaAccentColor = "#E1306C";
    ctaBoxBg = "rgba(225, 48, 108, 0.08)";
    ctaBorderColor = "#E1306C";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    );
  } else if (outroType === "youtube-channel") {
    ctaAccentColor = "#FF0000";
    ctaBoxBg = "rgba(255, 0, 0, 0.08)";
    ctaBorderColor = "#FF0000";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000" style={{ marginRight: 8 }}>
        <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.522 3.54 12 3.54 12 3.54s-7.522 0-9.388.513a3.003 3.003 0 0 0-2.11 2.11C0 8.028 0 12 0 12s0 3.972.502 5.837a3.003 3.003 0 0 0 2.11 2.11C4.478 20.46 12 20.46 12 20.46s7.522 0 9.388-.513a3.003 3.003 0 0 0 2.11-2.11C24 15.972 24 12 24 12s0-3.972-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  } else if (outroType === "website-link") {
    ctaAccentColor = "#00f0ff";
    ctaBoxBg = "rgba(0, 240, 255, 0.08)";
    ctaBorderColor = "#00f0ff";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth={2} style={{ marginRight: 8 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20" />
      </svg>
    );
  } else if (outroType === "social-badge") {
    ctaAccentColor = "#FFD700";
    ctaBoxBg = "rgba(255, 215, 0, 0.08)";
    ctaBorderColor = "#FFD700";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="#FFD700" style={{ marginRight: 8 }}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  } else if (outroType === "business-card") {
    ctaAccentColor = "#00e5ff";
    ctaBoxBg = "rgba(0, 229, 255, 0.08)";
    ctaBorderColor = "#00e5ff";
    buttonIcon = (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    );
  } else {
    // default (simple-clean)
    ctaAccentColor = accentColor;
    ctaBoxBg = "rgba(255, 255, 255, 0.08)";
    ctaBorderColor = accentColor;
    buttonIcon = null;
  }

  return (
    <AbsoluteFill style={{ background: "#000805", overflow: "hidden" }}>
      {/* Plain dark background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(160deg, ${theme.backgroundGradientStart} 0%, #000000 60%, ${theme.backgroundGradientEnd} 100%)`,
        zIndex: 1
      }} />

      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        background: "radial-gradient(circle, transparent 20%, rgba(0,0,0,0.95) 100%)",
        pointerEvents: "none",
      }} />

      <div style={{
        position: "absolute",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: 860,
        height: 1160,
        zIndex: 5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "100%",
          height: "100%",
          background: boxBg,
          border: `2.5px solid ${borderGrad}`,
          borderRadius: "36px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 35px 80px rgba(0, 0, 0, 0.95), inset 0 1px 3px rgba(255, 255, 255, 0.15)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "50px",
          transform: `scale(${cardIn})`,
        }}>
          <div style={{
            position: "absolute",
            inset: 20,
            border: `1.5px solid ${accentColor}33`,
            borderRadius: "24px",
            pointerEvents: "none",
          }} />

          {/* Icon Crest */}
          <div style={{
            width: 140,
            height: 140,
            marginBottom: 25,
            transform: crestTransform,
            opacity: cardIn,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            filter: `drop-shadow(0 4px 12px ${accentColor}44)`,
          }}>
            {iconSvg}
          </div>

          {/* Headline Text */}
          <div style={{
            fontFamily: titleFont,
            fontSize: 70,
            fontWeight: "bold",
            textAlign: "center",
            lineHeight: 1.05,
            letterSpacing: 4,
            transform: `translateY(${(1 - text1In) * 30}px)`,
            opacity: text1In,
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.9))",
            textTransform: 'uppercase',
            color: accentColor,
            ...titleStyle
          }}>
            {scene.textOverlay || "Thank You"}
          </div>

          {dividerElement}

          {/* Subtitle */}
          {scene.subtitle && (
            <div style={{
              fontFamily: theme.fontFamily || 'sans-serif',
              fontSize: 24,
              textAlign: "center",
              transform: `translateY(${(1 - text2In) * 20}px)`,
              opacity: text2In,
              textShadow: "0 3px 8px rgba(0,0,0,0.95)",
              ...subtitleStyle
            }}>
              {scene.subtitle}
            </div>
          )}

          {/* Action Box */}
          {phoneNum && (
            <div style={{
              transform: `scale(${waBoxIn}) translateY(${(1 - waBoxIn) * 30}px)`,
              opacity: waBoxIn,
              marginTop: 40,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "24px 40px",
              background: ctaBoxBg,
              border: `2px solid ${ctaBorderColor}`,
              borderRadius: "22px",
              boxShadow: `0 0 ${35 * pulse}px ${ctaBorderColor}33`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                {buttonIcon}
                <span style={{ fontSize: 13, fontWeight: 900, color: ctaAccentColor, letterSpacing: 2, textTransform: "uppercase" }}>
                  {ctaText}
                </span>
              </div>
              <div style={{
                fontFamily: theme.fontFamily || 'sans-serif',
                fontWeight: 900,
                fontSize: phoneNum.length > 15 ? 28 : 40,
                color: "#FFF",
                letterSpacing: 2,
                textAlign: "center",
                textShadow: "0 3px 10px rgba(0,0,0,0.6)",
              }}>
                {phoneNum}
              </div>
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==========================================
// 4.5. GENERAL-PURPOSE LAYOUTS & MOTION GRAPHICS HELPERS

// Velvet Curtains opening/closing reveal
const TheaterCurtains: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // opening: 0 to 22 frames; closing: (duration - 22) to duration
  const openT = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const closeT = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  const progress = frame < durationInFrames / 2 ? openT : closeT; // 0 = closed (curtains meet), 1 = open (curtains offscreen)
  const leftTranslate = -50 * progress; // % width
  const rightTranslate = 50 * progress; // % width
  
  const GOLD = '#D4AF37';
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 18 }}>
      {/* Left Curtain */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: '50%',
        background: 'repeating-linear-gradient(90deg, #5A000A 0px, #7A0010 30px, #9A001E 60px, #7A0010 90px, #5A000A 120px)',
        borderRight: `4px solid ${GOLD}`,
        boxShadow: '0 0 25px rgba(0,0,0,0.8), 5px 0 15px rgba(212,175,55,0.4)',
        transform: `translateX(${leftTranslate}%)`,
        transition: 'transform 0.05s linear',
      }}>
        {/* Curtain drape rope detail */}
        <div style={{
          position: 'absolute', right: 10, bottom: 80, width: 30, height: 120,
          border: `2px solid ${GOLD}`, borderRight: 'none', borderRadius: '20px 0 0 20px',
          opacity: 1 - progress,
        }} />
      </div>
      
      {/* Right Curtain */}
      <div style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: '50%',
        background: 'repeating-linear-gradient(90deg, #5A000A 0px, #7A0010 30px, #9A001E 60px, #7A0010 90px, #5A000A 120px)',
        borderLeft: `4px solid ${GOLD}`,
        boxShadow: '0 0 25px rgba(0,0,0,0.8), -5px 0 15px rgba(212,175,55,0.4)',
        transform: `translateX(${rightTranslate}%)`,
        transition: 'transform 0.05s linear',
      }}>
        {/* Curtain drape rope detail */}
        <div style={{
          position: 'absolute', left: 10, bottom: 80, width: 30, height: 120,
          border: `2px solid ${GOLD}`, borderLeft: 'none', borderRadius: '0 20px 20px 0',
          opacity: 1 - progress,
        }} />
      </div>
    </div>
  );
};

// Golden Stage Spotlight Ray Sweep
const Spotlight: React.FC = () => {
  const frame = useCurrentFrame();
  // Sweep back and forth
  const angle = interpolate(Math.sin(frame * 0.04), [-1, 1], [-20, 20]);
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      top: -20,
      width: 400,
      height: 800,
      background: 'linear-gradient(to bottom, rgba(255, 215, 0, 0.22) 0%, rgba(255, 215, 0, 0.05) 50%, transparent 100%)',
      clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
      transformOrigin: 'top center',
      transform: `translateX(-50%) rotate(${angle}deg)`,
      mixBlendMode: 'screen',
      pointerEvents: 'none',
      zIndex: 13,
    }} />
  );
};

// Metallic Shine Sweep Reflection Highlight
const ShineSweepOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  // sweeps from left to right (from -120% to 220%)
  const tx = interpolate(frame % 90, [10, 50], [-120, 220], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12, overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, bottom: 0, width: '60%',
        background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.45) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.45) 55%, transparent 70%)',
        transform: `translateX(${tx}%) skewX(-25deg)`,
        mixBlendMode: 'overlay',
      }} />
    </div>
  );
};

// Prism Chromatic Edge Refraction Overlay
const PrismRefractionOverlay: React.FC<{ 
  imageUrl: string; 
  layout: string;
  rotation?: number;
  zoom?: number;
  position?: string;
}> = ({ imageUrl, layout, rotation = 0, zoom = 1, position = 'center' }) => {
  const frame = useCurrentFrame();
  const objFit = layout === 'full-bleed' ? 'cover' : 'contain';
  
  // Breathing/pulse size for the duplicated frames
  const offset = Math.sin(frame * 0.1) * 6;
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 11, overflow: 'hidden' }}>
      {/* Left refracted clone */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.16,
        transform: `scale(1.05) translate(${-12 + offset}px, ${offset}px) rotate(-1.5deg)`,
        filter: 'hue-rotate(90deg) blur(3px) contrast(1.2)',
        mixBlendMode: 'screen',
      }}>
        <Img src={imageUrl} style={{ 
          width: '100%', height: '100%', 
          objectFit: objFit,
          objectPosition: position,
          transform: `rotate(${rotation}deg) scale(${zoom})`
        }} />
      </div>
      
      {/* Right refracted clone */}
      <div style={{
        position: 'absolute', inset: 0,
        opacity: 0.16,
        transform: `scale(1.05) translate(${12 - offset}px, ${-offset}px) rotate(1.5deg)`,
        filter: 'hue-rotate(-90deg) blur(3px) contrast(1.2)',
        mixBlendMode: 'screen',
      }}>
        <Img src={imageUrl} style={{ 
          width: '100%', height: '100%', 
          objectFit: objFit,
          objectPosition: position,
          transform: `rotate(${rotation}deg) scale(${zoom})`
        }} />
      </div>
    </div>
  );
};

// Cyber HUD Reticle & Scanning Coordinates
const CyberHudOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Deterministic fake coordinates that change every 6 frames
  const seed = Math.floor(frame / 6);
  const lat = (45.1235 + Math.sin(seed * 1.7) * 0.05).toFixed(4);
  const lng = (-122.4356 + Math.cos(seed * 2.3) * 0.05).toFixed(4);
  
  // Scanning line slide
  const scanY = interpolate(frame % 60, [0, 60], [0, 100]);
  
  return (
    <div style={{
      position: 'absolute', inset: 32, pointerEvents: 'none', zIndex: 14,
      border: '1px solid rgba(0, 240, 255, 0.25)',
      fontFamily: 'monospace', fontSize: 11, color: '#00f0ff',
      textShadow: '0 0 4px rgba(0,240,255,0.6)',
    }}>
      {/* Center crosshair */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 20, height: 20,
        border: '1px solid rgba(0, 240, 255, 0.6)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
      }}>
        <div style={{ position: 'absolute', left: '50%', top: -6, bottom: -6, width: 1, background: '#00f0ff', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', top: '50%', left: -6, right: -6, height: 1, background: '#00f0ff', transform: 'translateY(-50%)' }} />
      </div>
      
      {/* Top Left Bracket */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 25, height: 25, borderTop: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
      {/* Top Right Bracket */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 25, height: 25, borderTop: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />
      {/* Bottom Left Bracket */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: 25, height: 25, borderBottom: '2px solid #00f0ff', borderLeft: '2px solid #00f0ff' }} />
      {/* Bottom Right Bracket */}
      <div style={{ position: 'absolute', bottom: 0, right: 0, width: 25, height: 25, borderBottom: '2px solid #00f0ff', borderRight: '2px solid #00f0ff' }} />
      
      {/* Scanning laser bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: 'linear-gradient(to right, transparent, rgba(0,240,255,0.7), transparent)',
        boxShadow: '0 0 10px #00f0ff',
        top: `${scanY}%`,
      }} />
      
      {/* Data display overlays */}
      <div style={{ position: 'absolute', top: 8, left: 8 }}>SYS_ACTIVE // REC_001</div>
      <div style={{ position: 'absolute', top: 8, right: 8 }}>FPS: 30.00 // LNK_OK</div>
      <div style={{ position: 'absolute', bottom: 8, left: 8 }}>POS_LAT: {lat}</div>
      <div style={{ position: 'absolute', bottom: 8, right: 8 }}>POS_LNG: {lng}</div>
      <div style={{ position: 'absolute', top: '50%', left: 8, transform: 'translateY(-50%)' }}>LOCK_ON</div>
      <div style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)' }}>AZIMUTH: {(seed * 17.5 % 360).toFixed(1)}°</div>
    </div>
  );
};

// Vintage Film Dust & Scratches
const FilmDustScratches: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Seedable pseudo-random generator
  const pseudoRandom = (f: number, s: number) => {
    const x = Math.sin(f * 12.9898 + s * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };
  
  // Generate coordinates deterministically per frame so they flicker naturally
  const dustCount = 4;
  const dustSpots = Array.from({ length: dustCount }).map((_, i) => ({
    x: pseudoRandom(frame, i * 10) * 100,
    y: pseudoRandom(frame, i * 10 + 5) * 100,
    size: 1.5 + pseudoRandom(frame, i * 10 + 2) * 3.5,
    opacity: 0.2 + pseudoRandom(frame, i * 10 + 3) * 0.4,
  }));
  
  const scratchX = pseudoRandom(frame, 99) * 100;
  const scratchOpacity = pseudoRandom(frame, 88) > 0.6 ? 0.15 : 0.0;
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 12 }}>
      {/* Scratches */}
      {scratchOpacity > 0 && (
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${scratchX}%`, width: 1.2,
          background: 'rgba(255, 255, 255, 0.45)',
          boxShadow: '0 0 2px rgba(255, 255, 255, 0.2)',
          opacity: scratchOpacity,
        }} />
      )}
      
      {/* Dust Specks */}
      {dustSpots.map((d, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${d.x}%`,
          top: `${d.y}%`,
          width: d.size,
          height: d.size,
          borderRadius: '50%',
          background: pseudoRandom(frame, i + 15) > 0.5 ? '#111' : '#EEE',
          opacity: d.opacity,
          transform: `scale(${pseudoRandom(frame, i + 8) > 0.5 ? 1 : 1.5})`,
        }} />
      ))}
    </div>
  );
};

// Shape Bursts (Expanding Ring & Radial Spark Lines)
const ShapeBursts: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Burst runs in the first 20 frames of the scene
  const active = frame < 20;
  if (!active) return null;
  
  const ringScale = interpolate(frame, [0, 18], [0.1, 2.0], { extrapolateRight: 'clamp' });
  const ringOpacity = interpolate(frame, [0, 18], [0.8, 0], { extrapolateRight: 'clamp' });
  const sparkDistance = interpolate(frame, [0, 18], [0, 95], { extrapolateRight: 'clamp' });
  const sparkLength = interpolate(frame, [0, 8, 18], [0, 30, 0], { extrapolateRight: 'clamp' });
  const sparkOpacity = interpolate(frame, [0, 18], [0.9, 0], { extrapolateRight: 'clamp' });
  
  const color = '#FFD700'; // Gold theme
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 16 }}>
      {/* Expanding Ring */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 120, height: 120,
        border: `3px solid ${color}`,
        borderRadius: '50%',
        boxShadow: `0 0 10px ${color}`,
        transform: `translate(-50%, -50%) scale(${ringScale})`,
        opacity: ringOpacity,
      }} />
      
      {/* 8 Radial Sparks */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = i * 45;
        return (
          <div key={i} style={{
            position: 'absolute', left: '50%', top: '50%',
            transform: `translate(-50%, -50%) rotate(${angle}deg)`,
          }}>
            <div style={{
              width: 4,
              height: sparkLength,
              background: `linear-gradient(to bottom, #FFF, ${color})`,
              boxShadow: `0 0 8px ${color}`,
              transform: `translateY(-${sparkDistance}px)`,
              opacity: sparkOpacity,
              borderRadius: '2px',
            }} />
          </div>
        );
      })}
    </div>
  );
};

// Lower-Third Sleek Info Banner
const LowerThirdBanner: React.FC<{ title: string; subtitle?: string; font?: string }> = ({ title, subtitle, font }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  
  // Enter slide-in (0 to 18 frames), Exit slide-out (last 18 frames)
  const enter = interpolate(frame, [0, 18], [-450, 0], { extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [durationInFrames - 18, durationInFrames], [0, -450], { extrapolateLeft: 'clamp' });
  const slideX = frame < durationInFrames / 2 ? enter : exit;
  
  return (
    <div style={{
      position: 'absolute', bottom: '15%', left: '8%', zIndex: 16,
      pointerEvents: 'none',
      transform: `translateX(${slideX}px)`,
    }}>
      <div style={{
        background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 75%, transparent 100%)',
        borderLeft: '5px solid #FFD700',
        padding: '12px 28px 12px 18px',
        borderRadius: '0 8px 8px 0',
        boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <div style={{
          fontFamily: font || 'sans-serif',
          fontWeight: 900, fontSize: 22, color: '#FFF',
          letterSpacing: 1.5,
          textTransform: 'uppercase',
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontFamily: font || 'sans-serif',
            fontWeight: 400, fontSize: 13, color: '#FFD700',
            letterSpacing: 2,
            textTransform: 'uppercase',
            opacity: 0.9,
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// Kinetic Bar Reveal Transition Overlay
const KineticBarReveal: React.FC = () => {
  const frame = useCurrentFrame();
  
  // Three diagonal bars sweeping across the screen at the start of a scene
  const bar1 = interpolate(frame, [0, 15], [-120, 130], { extrapolateRight: 'clamp' });
  const bar2 = interpolate(frame, [3, 18], [-120, 130], { extrapolateRight: 'clamp' });
  const bar3 = interpolate(frame, [6, 20], [-120, 130], { extrapolateRight: 'clamp' });
  
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 17 }}>
      {/* Bar 1 - Deep Gold */}
      <div style={{
        position: 'absolute', top: '-20%', bottom: '-20%', width: '35%',
        background: 'linear-gradient(to bottom, #AA7C11, #D4AF37, #FFD700)',
        transform: `translateX(${bar1}%) skewX(-20deg)`,
        boxShadow: '0 0 30px rgba(0,0,0,0.5)',
      }} />
      
      {/* Bar 2 - Dark Luxury Velvet */}
      <div style={{
        position: 'absolute', top: '-20%', bottom: '-20%', width: '40%',
        background: 'linear-gradient(to bottom, #4A0005, #7A0010, #5A000A)',
        transform: `translateX(${bar2}%) skewX(-20deg)`,
        boxShadow: '0 0 30px rgba(0,0,0,0.6)',
      }} />
      
      {/* Bar 3 - Sleek White Accent */}
      <div style={{
        position: 'absolute', top: '-20%', bottom: '-20%', width: '15%',
        background: '#FFFFFF',
        transform: `translateX(${bar3}%) skewX(-20deg)`,
        boxShadow: '0 0 20px rgba(0,0,0,0.4)',
        opacity: 0.9,
      }} />
    </div>
  );
};

// Drifting Ambient Bokeh Field
const BokehField: React.FC<{ count?: number }> = ({ count = 10 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  
  const pseudoRandom = (idx: number, key: number) => {
    const x = Math.sin(idx * 43.19 + key * 87.41) * 31415.926;
    return x - Math.floor(x);
  };
  
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      x: pseudoRandom(i, 1) * width,
      startY: pseudoRandom(i, 2) * height,
      size: 40 + pseudoRandom(i, 3) * 90,
      speed: 0.8 + pseudoRandom(i, 4) * 1.5,
      opacity: 0.1 + pseudoRandom(i, 5) * 0.15,
      phase: pseudoRandom(i, 6) * 100,
      color: pseudoRandom(i, 7) > 0.5 ? 'rgba(255, 220, 100, ' : 'rgba(255, 150, 100, ',
    }));
  }, [count, width, height]);
  
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, overflow: 'hidden' }}>
      {particles.map((p, i) => {
        // Drift upwards
        const currentY = ((p.startY - frame * p.speed) % height + height) % height;
        // Pulse opacity slightly
        const currentOpacity = p.opacity * (0.7 + 0.3 * Math.sin(frame * 0.04 + p.phase));
        
        return (
          <div key={i} style={{
            position: 'absolute',
            left: p.x,
            top: currentY,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: `${p.color}${currentOpacity})`,
            filter: 'blur(16px)',
          }} />
        );
      })}
    </div>
  );
};

// Layout: 2 Images Split Comparison (Top / Bottom)
const SplitLayoutComponent: React.FC<{
  scene: SceneData;
  imageUrls: (string | null)[];
  imageTransform: string;
  imageFilter: string;
  imageObjFit: 'cover' | 'contain';
  frame: number;
}> = ({ scene, imageUrls, imageTransform, imageFilter, imageObjFit, frame }) => {
  const topUrl = imageUrls[0] || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5';
  const bottomUrl = imageUrls[1] || topUrl;
  
  // divider line scale/reveal
  const dividerScale = interpolate(frame, [5, 20], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  const topPlacement = getSceneImagePlacement(scene, 0);
  const bottomPlacement = getSceneImagePlacement(scene, 1);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', zIndex: 4 }}>
      {/* Top Half */}
      <div style={{ position: 'relative', height: '50%', width: '100%', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Img src={topUrl} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: topPlacement.position,
          transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${topPlacement.rotation}deg) scale(${topPlacement.zoom})`,
          filter: imageFilter === 'none' ? undefined : imageFilter
        }} />
        {/* 'BEFORE' or 'Top' label */}
        <div style={{
          position: 'absolute', top: 16, left: 16,
          background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.2)',
          color: '#FFF', fontSize: 11, fontWeight: 900, letterSpacing: 1.5,
          padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase',
          fontFamily: 'sans-serif'
        }}>
          Before
        </div>
      </div>
      
      {/* Divider Line */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', height: 3, width: `${dividerScale}%`,
        background: 'linear-gradient(to right, transparent, #FFD700, #FFF, #FFD700, transparent)',
        boxShadow: '0 0 10px #FFD700, 0 0 2px #FFF',
        transform: 'translate(-50%, -50%)',
        zIndex: 5,
      }} />
      
      {/* Bottom Half */}
      <div style={{ position: 'relative', height: '50%', width: '100%', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Img src={bottomUrl} style={{
          width: '100%', height: '100%', objectFit: 'cover',
          objectPosition: bottomPlacement.position,
          transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${bottomPlacement.rotation}deg) scale(${bottomPlacement.zoom})`,
          filter: imageFilter === 'none' ? undefined : imageFilter
        }} />
        {/* 'AFTER' or 'Bottom' label */}
        <div style={{
          position: 'absolute', bottom: 16, left: 16,
          background: 'rgba(212, 175, 55, 0.85)', border: '1px solid #FFD700',
          color: '#000', fontSize: 11, fontWeight: 900, letterSpacing: 1.5,
          padding: '4px 10px', borderRadius: '4px', textTransform: 'uppercase',
          fontFamily: 'sans-serif'
        }}>
          After
        </div>
      </div>
    </div>
  );
};

// Layout: 4 Images 2x2 Grid Component
const Grid4LayoutComponent: React.FC<{
  scene: SceneData;
  imageUrls: (string | null)[];
  imageFilter: string;
  frame: number;
  fps: number;
}> = ({ scene, imageUrls, imageFilter, frame, fps }) => {
  const fallbacks = [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf'
  ];
  
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 4,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr',
      gap: 12, padding: 12,
      background: 'rgba(0,0,0,0.35)',
    }}>
      {Array.from({ length: 4 }).map((_, i) => {
        const url = imageUrls[i] || fallbacks[i % fallbacks.length];
        
        // Staggered zoom animation for each grid cell
        const cellSpring = spring({
          frame: Math.max(0, frame - i * 5),
          fps,
          config: { damping: 13, stiffness: 120 }
        });
        const zoom = interpolate(cellSpring, [0, 1], [0.85, 1.0]);
        const opacity = interpolate(cellSpring, [0, 1], [0, 1]);
        
        const placement = getSceneImagePlacement(scene, i);

        return (
          <div key={i} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            transform: `scale(${zoom})`,
            opacity,
          }}>
            <Img src={url} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: placement.position,
              transform: `rotate(${placement.rotation}deg) scale(${placement.zoom})`,
              filter: imageFilter === 'none' ? undefined : imageFilter
            }} />
            <div style={{
              position: 'absolute', bottom: 8, right: 8,
              background: 'rgba(0,0,0,0.5)', color: 'rgba(255,255,255,0.7)',
              fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace'
            }}>
              #{i + 1}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Layout: 6 Images 2x3 Grid Component (Perfect for vertical 9:16 layout)
const Grid6LayoutComponent: React.FC<{
  scene: SceneData;
  imageUrls: (string | null)[];
  imageFilter: string;
  frame: number;
  fps: number;
}> = ({ scene, imageUrls, imageFilter, frame, fps }) => {
  const fallbacks = [
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5',
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38',
    'https://images.unsplash.com/photo-1541701494587-cb58502866ab',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf',
    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7',
    'https://images.unsplash.com/photo-1520408222757-6f9f95d87d5d'
  ];
  
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 4,
      display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr',
      gap: 8, padding: 8,
      background: 'rgba(0,0,0,0.4)',
    }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const url = imageUrls[i] || fallbacks[i % fallbacks.length];
        
        // Staggered zoom animation for each grid cell
        const cellSpring = spring({
          frame: Math.max(0, frame - i * 4),
          fps,
          config: { damping: 13, stiffness: 120 }
        });
        const zoom = interpolate(cellSpring, [0, 1], [0.82, 1.0]);
        const opacity = interpolate(cellSpring, [0, 1], [0, 1]);
        
        const placement = getSceneImagePlacement(scene, i);

        return (
          <div key={i} style={{
            position: 'relative', overflow: 'hidden', borderRadius: 8,
            border: '1.5px solid rgba(255,255,255,0.12)',
            boxShadow: '0 6px 15px rgba(0,0,0,0.65)',
            transform: `scale(${zoom})`,
            opacity,
          }}>
            <Img src={url} style={{
              width: '100%', height: '100%', objectFit: 'cover',
              objectPosition: placement.position,
              transform: `rotate(${placement.rotation}deg) scale(${placement.zoom})`,
              filter: imageFilter === 'none' ? undefined : imageFilter
            }} />
          </div>
        );
      })}
    </div>
  );
};

// ==========================================
// 5. MAIN STAGE RENDERING ENGINE
// ==========================================

const SceneComponent: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Layout Mode Determination ---
  const layout = scene.layout || 'framed';
  const primaryPlacement = getSceneImagePlacement(scene, 0);

  // --- Dynamic Image Scaling & Animation ---
  let imageTransform = 'none';
  let imageFilter: string = 'none';

  // --- Apply Color Grading Filters ---
  if (scene.colorFilter && scene.colorFilter !== 'none') {
    if (scene.colorFilter === 'teal-orange') {
      imageFilter = 'contrast(1.1) saturate(1.25) sepia(0.15) hue-rotate(-10deg)';
    } else if (scene.colorFilter === 'vintage-warm') {
      imageFilter = 'sepia(0.35) contrast(0.95) brightness(1.05) saturate(0.9)';
    } else if (scene.colorFilter === 'emerald-luxury') {
      imageFilter = 'contrast(1.15) brightness(0.92) saturate(1.15) hue-rotate(15deg) sepia(0.05)';
    } else if (scene.colorFilter === 'noir-bw') {
      imageFilter = 'grayscale(1) contrast(1.35) brightness(0.95)';
    } else if (scene.colorFilter === 'hdr-vibrant') {
      imageFilter = 'contrast(1.25) saturate(1.5) brightness(1.02)';
    }
  }

  if (scene.imageUrl) {
    if (scene.imageAnimation === 'zoom-slow') {
      const scale = interpolate(frame, [0, scene.durationInFrames], [1.0, 1.15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `scale(${scale})`;
    } else if (scene.imageAnimation === 'pan') {
      const translateX = interpolate(frame, [0, scene.durationInFrames], [-20, 20], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `translateX(${translateX}px) scale(1.08)`;
    } else if (scene.imageAnimation === 'zoom-fast-beat') {
      // Pump on 15 frame beats
      const beat = spring({
        frame: frame % 15,
        fps,
        config: { damping: 7, stiffness: 150, mass: 0.5 }
      });
      const beatScale = interpolate(beat, [0, 1], [1.14, 1.0]);
      imageTransform = `scale(${beatScale})`;
    } else if (scene.imageAnimation === 'shake-beat') {
      // High frequency shake on beat start
      const beat = spring({
        frame: frame % 15,
        fps,
        config: { damping: 4, stiffness: 220, mass: 0.7 }
      });
      const decay = 1 - beat;
      const shakeX = Math.sin(frame * 2.5) * 14 * decay;
      const shakeY = Math.cos(frame * 2.9) * 14 * decay;
      const zoom = 1.05 + 0.05 * decay;
      imageTransform = `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`;
    } else if (scene.imageAnimation === 'zoom-in-out') {
      const pulse = Math.sin(frame * 0.12) * 0.08;
      const zoom = 1.05 + pulse;
      imageTransform = `scale(${zoom})`;
    } else if (scene.imageAnimation === 'slide-slow') {
      const translateX = interpolate(frame, [0, scene.durationInFrames], [-15, 15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `translateX(${translateX}px) scale(1.05)`;
    } else if (scene.imageAnimation === 'spin-transition') {
      const rot = interpolate(frame, [0, 15, scene.durationInFrames - 15, scene.durationInFrames], [90, 0, 0, -90], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `scale(1.25) rotate(${rot}deg)`;
    } else if (scene.imageAnimation === 'whip-left') {
      const tx = interpolate(frame, [0, 12], [-600, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `translateX(${tx}px) scale(1.05)`;
    } else if (scene.imageAnimation === 'whip-right') {
      const tx = interpolate(frame, [0, 12], [600, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageTransform = `translateX(${tx}px) scale(1.05)`;
    } else if (scene.imageAnimation === 'bounce-beat') {
      const beat = spring({
        frame: frame % 15,
        fps,
        config: { damping: 5, stiffness: 185, mass: 0.6 }
      });
      const bScale = interpolate(beat, [0, 0.3, 1], [1.0, 1.15, 1.0]);
      imageTransform = `scale(${bScale})`;
    }
  }

  // --- Chromatic Glitch / Blur screen filters ---
  if (scene.effect === 'glitch') {
    const isGlitch = frame % 6 === 0;
    const glitchAmp = Math.sin(frame * 3) * 6;
    if (isGlitch) {
      imageFilter = `${imageFilter === 'none' ? '' : imageFilter + ' '}hue-rotate(${glitchAmp * 12}deg) contrast(1.4) saturate(1.8)`;
      // Mix glitch translation
      imageTransform = `${imageTransform} translate(${glitchAmp * 1.5}px, ${glitchAmp * 0.5}px) skewX(${glitchAmp}deg)`;
    }
  } else if (scene.effect === 'radial-blur') {
    const blurVal = Math.min(12, frame < 8 ? (8 - frame) * 2.5 : (frame > scene.durationInFrames - 8 ? (frame - (scene.durationInFrames - 8)) * 2.5 : 0));
    if (blurVal > 0) {
      imageFilter = `${imageFilter === 'none' ? '' : imageFilter + ' '}blur(${blurVal}px)`;
    }
  } else if (scene.effect === 'optical-glow') {
    imageFilter = `${imageFilter === 'none' ? '' : imageFilter + ' '}brightness(1.1) contrast(1.03)`;
  } else if (scene.effect === 'dream-bloom') {
    imageFilter = `${imageFilter === 'none' ? '' : imageFilter + ' '}brightness(1.05) contrast(1.03) saturate(1.05)`;
  } else if (scene.effect === 'sharp-details') {
    imageFilter = `${imageFilter === 'none' ? '' : imageFilter + ' '}contrast(1.15) saturate(1.15) brightness(1.02)`;
  } else if (scene.effect === 'shake-flash-beat') {
    const beat = spring({
      frame: frame % 15,
      fps,
      config: { damping: 4, stiffness: 220, mass: 0.7 }
    });
    const decay = 1 - beat;
    const shakeX = Math.sin(frame * 2.5) * 14 * decay;
    const shakeY = Math.cos(frame * 2.9) * 14 * decay;
    const zoom = 1.05 + 0.05 * decay;
    imageTransform = `translate(${shakeX}px, ${shakeY}px) scale(${zoom})`;
  }

  // Fade animations for background/transition
  const sceneOpacity = interpolate(frame, getFadeRange(scene.durationInFrames, 8), [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Layout Box Styling logic
  let frameStyle: React.CSSProperties = {};
  if (layout === 'full-bleed') {
    frameStyle = {
      position: 'absolute',
      inset: 0,
      zIndex: 4,
      overflow: 'hidden',
    };
  } else if (layout === 'full-width-centered') {
    frameStyle = {
      position: 'absolute',
      inset: 0,
      zIndex: 4,
    };
  } else {
    // Default framed layout
    const hasText = !!scene.textOverlay;
    frameStyle = {
      position: 'absolute',
      top: hasText ? '12%' : '12.5%',
      left: '8%',
      right: '8%',
      height: hasText ? '62%' : '83.4%',
      zIndex: 4,
      overflow: 'hidden',
      borderRadius: '24px',
      border: scene.border === 'gold-filigree' 
        ? '2.5px solid rgba(212, 175, 55, 0.45)' 
        : scene.border === 'thin-line'
        ? '1px solid rgba(255, 255, 255, 0.25)'
        : '2.5px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 30px 60px rgba(0,0,0,0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  }

  const imageObjFit = layout === 'full-bleed' ? 'cover' : 'contain';

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      
      {/* 1. Backdrop Gradient fallback */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${theme.backgroundGradientStart}, ${theme.backgroundGradientEnd})`,
          zIndex: 1,
        }}
      />

      {/* 2. Content rendering based on sceneType */}
      {scene.sceneType === 'intro' ? (
        <IntroSlide scene={scene} theme={theme} />
      ) : scene.sceneType === 'outro' ? (
        <OutroSlide scene={scene} theme={theme} />
      ) : (
        <>
          {/* 3. Blurred duplicate background for premium Stage (skipped in full bleed) */}
          {(scene.imageUrl || (scene.imageUrls && scene.imageUrls[0])) && layout !== 'full-bleed' && (
            <Img 
              src={scene.imageUrl || (scene.imageUrls && scene.imageUrls[0]) || ''}
              style={{
                position: 'absolute',
                inset: -20,
                width: 'calc(100% + 40px)',
                height: 'calc(100% + 40px)',
                objectFit: 'cover',
                objectPosition: primaryPlacement.position,
                filter: scene.effect === 'glitch' 
                  ? 'blur(35px) brightness(0.12) saturate(1.5) contrast(1.3)' 
                  : 'blur(38px) brightness(0.14) saturate(1.1)',
                transform: `scale(1.12) rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                zIndex: 2,
              }}
            />
          )}

          {/* 4. Ambient radial glows (skipped in full bleed) */}
          {layout !== 'full-bleed' && (
            <div style={{
              position: 'absolute',
              inset: 27,
              boxShadow: scene.border === 'gold-filigree' 
                ? 'inset 0 0 120px rgba(212, 175, 55, 0.22)' 
                : 'inset 0 0 90px rgba(255, 255, 255, 0.08)',
              borderRadius: '18px',
              pointerEvents: 'none',
              zIndex: 5,
            }} />
          )}

          {/* 5. Main media frame */}
          {(scene.imageUrl || (scene.imageUrls && scene.imageUrls.length > 0)) && (
            <div style={frameStyle}>
              {layout === 'split-comparison' ? (
                <SplitLayoutComponent
                  scene={scene}
                  imageUrls={scene.imageUrls || []}
                  imageTransform={imageTransform}
                  imageFilter={imageFilter}
                  imageObjFit={imageObjFit}
                  frame={frame}
                />
              ) : layout === 'grid-4' ? (
                <Grid4LayoutComponent
                  scene={scene}
                  imageUrls={scene.imageUrls || []}
                  imageFilter={imageFilter}
                  frame={frame}
                  fps={fps}
                />
              ) : layout === 'grid-6' ? (
                <Grid6LayoutComponent
                  scene={scene}
                  imageUrls={scene.imageUrls || []}
                  imageFilter={imageFilter}
                  frame={frame}
                  fps={fps}
                />
              ) : scene.effect === 'chromatic-aberration' || scene.effect === 'rgb-split-beat' ? (
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <Img src={scene.imageUrl || ''} style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: imageObjFit, 
                    objectPosition: primaryPlacement.position,
                    transform: `${imageTransform === 'none' ? '' : imageTransform} translate(4px, 0px) rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                    filter: 'drop-shadow(rgba(255,0,0,0.6) 0px 0px 0px) brightness(1.2)',
                    mixBlendMode: 'screen',
                  }} />
                  <Img src={scene.imageUrl || ''} style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: imageObjFit, 
                    objectPosition: primaryPlacement.position,
                    transform: `${imageTransform === 'none' ? '' : imageTransform} translate(-4px, 0px) rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                    filter: 'drop-shadow(rgba(0,255,255,0.6) 0px 0px 0px) brightness(1.2)',
                    mixBlendMode: 'screen',
                  }} />
                  <Img src={scene.imageUrl || ''} style={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: imageObjFit, 
                    objectPosition: primaryPlacement.position,
                    transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                    opacity: 0.6,
                  }} />
                </div>
              ) : (
                <>
                  <Img src={scene.imageUrl || ''} style={{
                    width: layout === 'framed' ? undefined : '100%',
                    height: layout === 'framed' ? undefined : '100%',
                    maxWidth: layout === 'framed' ? '100%' : undefined,
                    maxHeight: layout === 'framed' ? '100%' : undefined,
                    objectFit: imageObjFit,
                    objectPosition: primaryPlacement.position,
                    transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                    filter: imageFilter === 'none' ? undefined : imageFilter,
                  }} />
                  {scene.effect === 'optical-glow' && (
                    <Img src={scene.imageUrl || ''} style={{
                      position: 'absolute', inset: 0,
                      width: layout === 'framed' ? undefined : '100%',
                      height: layout === 'framed' ? undefined : '100%',
                      maxWidth: layout === 'framed' ? '100%' : undefined,
                      maxHeight: layout === 'framed' ? '100%' : undefined,
                      objectFit: imageObjFit,
                      objectPosition: primaryPlacement.position,
                      transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                      filter: 'blur(6px) brightness(1.2) contrast(1.1)',
                      mixBlendMode: 'screen',
                      opacity: 0.2,
                      pointerEvents: 'none',
                    }} />
                  )}
                  {scene.effect === 'dream-bloom' && (
                    <Img src={scene.imageUrl || ''} style={{
                      position: 'absolute', inset: 0,
                      width: layout === 'framed' ? undefined : '100%',
                      height: layout === 'framed' ? undefined : '100%',
                      maxWidth: layout === 'framed' ? '100%' : undefined,
                      maxHeight: layout === 'framed' ? '100%' : undefined,
                      objectFit: imageObjFit,
                      objectPosition: primaryPlacement.position,
                      transform: `${imageTransform === 'none' ? '' : imageTransform} rotate(${primaryPlacement.rotation}deg) scale(${primaryPlacement.zoom})`,
                      filter: 'blur(8px) brightness(1.15) contrast(1.1)',
                      mixBlendMode: 'screen',
                      opacity: 0.15,
                      pointerEvents: 'none',
                    }} />
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}

      {/* 5. Custom typography layouts */}
      {scene.textOverlay && scene.border !== 'lower-third' && (
        <>
          {scene.textAnimation === 'typewriter' ? (
            <TypewriterText 
              text={scene.textOverlay}
              font={scene.textStyle === 'retro-vhs' || scene.textStyle === 'cyberpunk-hacker' ? 'monospace' : theme.fontFamily}
              style={{
                fontSize: scene.textStyle === 'editorial-minimal' ? '32px' : '46px',
                fontWeight: scene.textStyle === 'editorial-minimal' ? 300 : 800,
                color: scene.textStyle === 'cyberpunk-hacker' ? '#39ff14' : theme.textColor || '#ffffff',
                letterSpacing: scene.textStyle === 'editorial-minimal' ? '8px' : 'normal',
                textTransform: 'uppercase',
                textShadow: scene.textStyle === 'cyberpunk-hacker' 
                  ? '0 0 8px #39ff14' 
                  : scene.textStyle === 'retro-vhs'
                  ? '2px 2px #06b6d4, -2px -2px #eab308, 0 4px 10px rgba(0,0,0,0.9)'
                  : '0 4px 10px rgba(0,0,0,0.9)',
              }}
            />
          ) : (
            <>
              {scene.textStyle === 'metallic-gold' && (
                <PremiumKineticText text={scene.textOverlay} delay={6} />
              )}

              {scene.textStyle === 'glitch-red-blue' && (
                <GlitchText text={scene.textOverlay} font={theme.fontFamily} />
              )}

              {scene.textStyle === 'neon-glow' && (
                <NeonGlowText text={scene.textOverlay} font={theme.fontFamily} color={theme.textColor} />
              )}

              {scene.textStyle === 'retro-vhs' && (
                <div style={{
                  position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
                  fontFamily: 'Courier New, monospace', fontSize: '50px', fontWeight: 900, textTransform: 'uppercase',
                  textAlign: 'center', color: '#ffffff',
                  textShadow: '2px 2px #06b6d4, -2px -2px #eab308, 0 4px 10px rgba(0,0,0,0.9)',
                  transform: scene.textAnimation === 'slide-up' 
                    ? `translateY(${interpolate(frame, [0, 15], [35, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'slide-left'
                    ? `translateX(${interpolate(frame, [0, 15], [-100, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'zoom-in'
                    ? `scale(${spring({ frame, fps, config: { damping: 10 } })})`
                    : undefined,
                  opacity: interpolate(frame, getFadeRange(scene.durationInFrames, 10), [0, 1, 1, 0])
                }}>
                  {scene.textOverlay}
                </div>
              )}

              {scene.textStyle === 'cyberpunk-hacker' && (
                <div style={{
                  position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
                  fontFamily: 'monospace', fontSize: '46px', fontWeight: 700,
                  textAlign: 'center', color: '#39ff14',
                  textShadow: '0 0 8px rgba(57,255,20,0.7), 0 4px 10px rgba(0,0,0,0.9)',
                  transform: scene.textAnimation === 'slide-up' 
                    ? `translateY(${interpolate(frame, [0, 15], [35, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'slide-left'
                    ? `translateX(${interpolate(frame, [0, 15], [-100, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'zoom-in'
                    ? `scale(${spring({ frame, fps, config: { damping: 10 } })})`
                    : undefined,
                  opacity: interpolate(frame, getFadeRange(scene.durationInFrames, 10), [0, 1, 1, 0])
                }}>
                  {scene.textOverlay}
                  <span style={{ opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0 }}>_</span>
                </div>
              )}

              {scene.textStyle === 'editorial-minimal' && (
                <div style={{
                  position: 'absolute', left: 56, right: 56, bottom: '18%', zIndex: 15,
                  fontFamily: theme.fontFamily || 'sans-serif', fontSize: '32px', fontWeight: 300,
                  textAlign: 'center', color: '#ffffff', letterSpacing: '8px', textTransform: 'uppercase',
                  textShadow: '0 4px 12px rgba(0,0,0,0.8)',
                  transform: scene.textAnimation === 'slide-up' 
                    ? `translateY(${interpolate(frame, [0, 15], [35, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'slide-left'
                    ? `translateX(${interpolate(frame, [0, 15], [-100, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'zoom-in'
                    ? `scale(${spring({ frame, fps, config: { damping: 10 } })})`
                    : undefined,
                  opacity: interpolate(frame, getFadeRange(scene.durationInFrames, 10), [0, 1, 1, 0])
                }}>
                  {scene.textOverlay}
                </div>
              )}

              {(scene.textStyle === 'bold-clean' || scene.textStyle === 'serif-elegant') && (
                <div style={{
                  fontFamily: theme.fontFamily || 'sans-serif',
                  color: theme.textColor || '#ffffff',
                  fontSize: '54px',
                  fontWeight: scene.textStyle === 'bold-clean' ? 900 : 300,
                  fontStyle: scene.textStyle === 'serif-elegant' ? 'italic' : 'normal',
                  textAlign: 'center',
                  padding: '0 60px',
                  lineHeight: 1.25,
                  textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 0 30px rgba(0,0,0,0.4)',
                  zIndex: 15,
                  width: '100%',
                  position: 'absolute',
                  bottom: '18%',
                  transform: scene.textAnimation === 'slide-up' 
                    ? `translateY(${interpolate(frame, [0, 15], [35, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'slide-left'
                    ? `translateX(${interpolate(frame, [0, 15], [-100, 0], { extrapolateRight: 'clamp' })}px)`
                    : scene.textAnimation === 'zoom-in'
                    ? `scale(${spring({ frame, fps, config: { damping: 10 } })})`
                    : undefined,
                  opacity: interpolate(frame, getFadeRange(scene.durationInFrames, 10), [0, 1, 1, 0])
                }}>
                  {scene.textOverlay}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* 6. Flash effect */}
      {scene.effect === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: '#ffffff',
          opacity: interpolate(frame, [0, 6], [0.85, 0], { extrapolateRight: 'clamp' }),
          zIndex: 20,
          pointerEvents: 'none'
        }} />
      )}
      {scene.effect === 'shake-flash-beat' && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundColor: '#ffffff',
          opacity: interpolate(frame % 15, [0, 6], [0.75, 0], { extrapolateRight: 'clamp' }),
          zIndex: 20,
          pointerEvents: 'none'
        }} />
      )}

      {/* 7. Vignette effect */}
      {scene.effect === 'vignette' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
          background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 35%, rgba(0,0,0,0.7) 100%)'
        }} />
      )}

      {/* VHS distortion tracking lines */}
      {scene.effect === 'vhs-distortion' && <VhsDistortion />}

      {/* Optical Lens Flare */}
      {scene.effect === 'lens-flare' && <LensFlare />}

      {/* Shine sweep and glass refraction */}
      {scene.effect === 'shine-sweep' && <ShineSweep startFrame={0} />}
      {scene.effect === 'glass-refraction' && <GlassRefraction />}
      
      {/* General Purpose layouts/motion graphics effects */}
      {scene.effect === 'stage-spotlight' && <Spotlight />}
      {scene.effect === 'metallic-shine' && <ShineSweepOverlay />}
      {scene.effect === 'prism-split' && (
        <PrismRefractionOverlay 
          imageUrl={scene.imageUrl || (scene.imageUrls && scene.imageUrls[0]) || ''} 
          layout={layout} 
          rotation={primaryPlacement.rotation}
          zoom={primaryPlacement.zoom}
          position={primaryPlacement.position}
        />
      )}
      {scene.effect === 'shape-bursts' && <ShapeBursts />}

      {/* 8. Light Leaks */}
      {scene.lightLeak === 'police-flash' && <PoliceFlash />}
      {scene.lightLeak === 'aurora' && <AuroraLeak />}
      {scene.lightLeak === 'gold-glow' && <GoldLeak />}
      {scene.lightLeak === 'light-leak-warm' && <WarmLightLeak />}
      {scene.lightLeak === 'cyber-pulse' && <CyberPulseLeak />}
      {scene.lightLeak === 'film-burn-fast' && <FilmBurnLeak />}
      {scene.lightLeak === 'multi-runway' && <MultiRunwayLightLeak />}
      {scene.lightLeak === 'prism-refraction' && <PrismRefraction />}
      {scene.lightLeak === 'dreamy-haze' && <DreamyHaze />}

      {/* 9. Borders */}
      {scene.border === 'gold-filigree' && <GoldFiligreeBorder />}
      {scene.border === 'neon-frame' && <NeonBorder />}
      {scene.border === 'vhs-borders' && <VhsBorders />}
      {scene.border === 'cyber-scanner' && <CyberScannerBorder />}
      {scene.border === 'thin-line' && <ThinLineBorder />}
      {scene.border === 'drawing-pulse' && <DrawingBorder startFrame={0} />}
      {scene.border === 'corners-only' && <ModernCorners opacity={1} />}
      {scene.border === 'ornament-lace' && <OrnateLaceBorder />}
      
      {scene.border === 'theater-curtains' && <TheaterCurtains />}
      {scene.border === 'cyber-hud' && <CyberHudOverlay />}
      {scene.border === 'lower-third' && <LowerThirdBanner title={scene.textOverlay} subtitle={scene.subtitle} font={theme.fontFamily} />}
      {scene.border === 'kinetic-reveal' && <KineticBarReveal />}

      {/* 10. Letterbox */}
      {scene.letterbox && <Letterbox />}

      {/* 11. Particles */}
      {scene.particleOverlay === 'gold-flakes' && <GoldFlakesField />}
      {scene.particleOverlay === 'sparkles' && <SparkleField count={18} />}
      {scene.particleOverlay === 'dust-particles' && <DustField />}
      {scene.particleOverlay === 'digital-rain' && <DigitalRainField />}
      {scene.particleOverlay === 'fire-embers' && <FireEmbersField />}
      {scene.particleOverlay === 'gold-dust' && <GoldDustField count={30} />}
      {scene.particleOverlay === 'floating-petals' && <FloatingPetalsField count={15} />}
      
      {scene.particleOverlay === 'bokeh-particles' && <BokehField count={12} />}
      {scene.particleOverlay === 'film-dust-scratches' && <FilmDustScratches />}

    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<{ storyboard?: Storyboard }> = ({ storyboard = defaultStoryboard }) => {
  const theme = storyboard.visualTheme;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      
      {/* 1. Scenes container sequence */}
      {storyboard.scenes.map((scene, index) => {
        const start = storyboard.scenes.slice(0, index).reduce((acc, s) => acc + (s.durationInFrames || 90), 0);
        
        return (
          <Sequence
            key={scene.id || index}
            from={start}
            durationInFrames={scene.durationInFrames}
          >
            <SceneComponent scene={scene} theme={theme} />
          </Sequence>
        );
      })}

      {/* ==========================================
          2. PERSISTENT GLOBAL SYSTEM LAYERS
          ========================================== */}
      <FilmGrain />
      <ThreadProgressBar />
      {theme.watermarkText && <WatermarkOverlay text={theme.watermarkText} />}
      
      {/* Dynamic equalizer when Phonk features are actively requested */}
      {storyboard.scenes.some(s => s.imageAnimation === 'shake-beat' || s.imageAnimation === 'zoom-fast-beat') && (
        <AudioVisualizer />
      )}

    </AbsoluteFill>
  );
};
