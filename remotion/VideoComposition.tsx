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
  textOverlay: string;
  textStyle: 'bold-clean' | 'metallic-gold' | 'neon-glow' | 'glitch-red-blue' | 'serif-elegant';
  textAnimation: 'kinetic-spring' | 'fade' | 'slide-up' | 'zoom-in' | 'none';
  imageAnimation: 'pan' | 'zoom-slow' | 'zoom-fast-beat' | 'shake-beat' | 'none';
  effect: 'glitch' | 'flash' | 'vignette' | 'film-grain' | 'none';
  particleOverlay: 'gold-flakes' | 'sparkles' | 'dust-particles' | 'none';
  lightLeak: 'aurora' | 'police-flash' | 'gold-glow' | 'none';
  letterbox: boolean;
  border: 'none' | 'gold-filigree' | 'neon-frame';
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

// ==========================================
// 5. MAIN STAGE RENDERING ENGINE
// ==========================================

const SceneComponent: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Dynamic Image Scaling & Animation ---
  let imageTransform = 'none';
  let imageFilter: string = 'none';

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
    }
  }

  // --- Chromatic Glitch screen filters ---
  if (scene.effect === 'glitch') {
    const isGlitch = frame % 6 === 0;
    const glitchAmp = Math.sin(frame * 3) * 6;
    if (isGlitch) {
      imageFilter = `hue-rotate(${glitchAmp * 12}deg) contrast(1.4) saturate(1.8)`;
      // Mix glitch translation with existing animations
      imageTransform = `${imageTransform} translate(${glitchAmp * 1.5}px, ${glitchAmp * 0.5}px) skewX(${glitchAmp}deg)`;
    }
  }

  // Fade animations for background/transition
  const sceneOpacity = interpolate(frame, [0, 8, scene.durationInFrames - 8, scene.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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

      {/* 2. Blurred duplicate background for premium Stage */}
      {scene.imageUrl && (
        <div 
          style={{
            position: 'absolute',
            inset: -20,
            backgroundImage: `url(${scene.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: scene.effect === 'glitch' 
              ? 'blur(35px) brightness(0.12) saturate(1.5) contrast(1.3)' 
              : 'blur(38px) brightness(0.14) saturate(1.1)',
            transform: 'scale(1.12)',
            zIndex: 2,
          }}
        />
      )}

      {/* 3. Ambient radial glows */}
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

      {/* 4. Main media frame */}
      {scene.imageUrl && (
        <div 
          style={{
            position: 'absolute',
            top: '12%',
            left: '8%',
            right: '8%',
            height: '62%',
            zIndex: 4,
            overflow: 'hidden',
            borderRadius: '24px',
            border: scene.border === 'gold-filigree' 
              ? '2.5px solid rgba(212, 175, 55, 0.45)' 
              : '2.5px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.85)',
          }}
        >
          <Img src={scene.imageUrl} style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: imageTransform,
            filter: imageFilter,
          }} />
        </div>
      )}

      {/* 5. Custom typography layouts */}
      {scene.textOverlay && (
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
                : scene.textAnimation === 'zoom-in'
                ? `scale(${spring({ frame, fps, config: { damping: 10 } })})`
                : undefined,
              opacity: interpolate(frame, [0, 10, scene.durationInFrames - 10, scene.durationInFrames], [0, 1, 1, 0])
            }}>
              {scene.textOverlay}
            </div>
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

      {/* 7. Vignette effect */}
      {scene.effect === 'vignette' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 6,
          background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 35%, rgba(0,0,0,0.7) 100%)'
        }} />
      )}

      {/* 8. Light Leaks */}
      {scene.lightLeak === 'police-flash' && <PoliceFlash />}
      {scene.lightLeak === 'aurora' && <AuroraLeak />}
      {scene.lightLeak === 'gold-glow' && <GoldLeak />}

      {/* 9. Borders */}
      {scene.border === 'gold-filigree' && <GoldFiligreeBorder />}
      {scene.border === 'neon-frame' && <NeonBorder />}

      {/* 10. Letterbox */}
      {scene.letterbox && <Letterbox />}

      {/* 11. Particles */}
      {scene.particleOverlay === 'gold-flakes' && <GoldFlakesField />}
      {scene.particleOverlay === 'sparkles' && <SparkleField count={18} />}
      {scene.particleOverlay === 'dust-particles' && <DustField />}

    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const theme = storyboard.visualTheme;
  let currentStartFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      
      {/* 1. Scenes container sequence */}
      {storyboard.scenes.map((scene, index) => {
        const start = currentStartFrame;
        currentStartFrame += scene.durationInFrames;
        
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
