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
  textAnimation: 'fade' | 'slide-up' | 'zoom-in' | 'none';
  imageAnimation: 'pan' | 'zoom' | 'none';
}

export interface VisualTheme {
  template: 'maggam-cinematic' | 'luxury-gold-crazy' | 'clean-glow';
  backgroundGradientStart: string;
  backgroundGradientEnd: string;
  textColor: string;
  fontFamily: string;
}

export interface Storyboard {
  visualTheme: VisualTheme;
  scenes: SceneData[];
}

export const defaultStoryboard: Storyboard = {
  visualTheme: {
    template: 'luxury-gold-crazy',
    backgroundGradientStart: '#000805',
    backgroundGradientEnd: '#011c12',
    textColor: '#ffffff',
    fontFamily: 'Plus Jakarta Sans',
  },
  scenes: [
    {
      id: 1,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Exquisite Handcrafted Bridal Designs",
      textAnimation: 'slide-up',
      imageAnimation: 'none',
    },
    {
      id: 2,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Luxury Gold Thread Work 🪡",
      textAnimation: 'zoom-in',
      imageAnimation: 'none',
    },
    {
      id: 3,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Jaya Ladies Tailor ✨",
      textAnimation: 'fade',
      imageAnimation: 'none',
    }
  ]
};

// ==========================================
// 1. CINEMATIC EFFECT COMPONENTS
// ==========================================

// Letterbox bars
const Letterbox: React.FC<{ height?: number }> = ({ height = 85 }) => {
  const frame = useCurrentFrame();
  const t = Math.min(1, frame / 20);
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

// Film grain overlay
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
      opacity: 0.045,
      mixBlendMode: 'overlay',
    }} />
  );
};

// Anamorphic gold lens flare
const LensFlare: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const x = interpolate(frame, [0, durationInFrames], [-600, 1800]);
  const flicker = 0.12 + 0.06 * Math.sin(frame * 0.08);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 9 }}>
      <div style={{
        position: 'absolute',
        top: '38%',
        left: x,
        width: 800,
        height: 2,
        background: `linear-gradient(to right, transparent, rgba(232,201,125,${flicker}), rgba(255,220,160,${flicker * 1.5}), rgba(232,201,125,${flicker}), transparent)`,
        filter: 'blur(1px)',
      }} />
      <div style={{
        position: 'absolute',
        top: '36%',
        left: x + 300,
        width: 180,
        height: 120,
        borderRadius: '50%',
        background: `radial-gradient(ellipse, rgba(255,220,160,${flicker * 0.5}) 0%, transparent 70%)`,
        filter: 'blur(30px)',
      }} />
    </div>
  );
};

// Color grade vignette
const ColorGrade: React.FC = () => {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 7,
        background: 'linear-gradient(to bottom, rgba(10,30,40,0.15) 0%, transparent 40%, transparent 60%, rgba(10,20,30,0.2) 100%)',
        mixBlendMode: 'color',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
        background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 30%, rgba(0,0,0,0.65) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 8,
        background: `
          linear-gradient(to bottom,
            rgba(0,0,0,0.45) 0%,
            transparent 18%,
            transparent 55%,
            rgba(0,0,0,0.55) 80%,
            rgba(0,0,0,0.75) 100%
          )
        `,
      }} />
    </>
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
const Watermark: React.FC = () => {
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
        fontSize: 15,
        color: 'rgba(255,255,255,0.75)',
        letterSpacing: 3,
        textTransform: 'uppercase',
        textShadow: '0 1px 8px rgba(0,0,0,0.9)',
      }}>
        Jaya Ladies Tailor
      </div>
      <div style={{
        marginTop: 4,
        height: 1.5,
        width: 90,
        background: 'linear-gradient(to right, rgba(232,201,125,0.6), transparent)',
      }} />
    </div>
  );
};

// Corner Ornament
const CornerOrnament: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return (
    <svg 
      style={{
        position: 'absolute',
        width: 60, height: 60,
        zIndex: 14,
        pointerEvents: 'none',
        filter: 'drop-shadow(0 0 6px rgba(212, 175, 55, 0.85)) drop-shadow(0 2px 10px rgba(0,0,0,0.9))',
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
      <path d="M 12 90 L 12 12 L 90 12" fill="none" stroke="url(#goldGradFiligree)" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M 24 76 C 24 45, 45 24, 76 24" fill="none" stroke="url(#goldGradFiligree)" strokeWidth="1.5" strokeDasharray="2 3" />
      <path d="M 45 45 L 50 38 L 55 45 L 50 52 Z" fill="url(#goldGradFiligree)" />
      <circle cx="12" cy="12" r="4.5" fill="url(#goldGradFiligree)" />
      <circle cx="12" cy="90" r="3.5" fill="#FFF" />
      <circle cx="90" cy="12" r="3.5" fill="#FFF" />
    </svg>
  );
};

// Royal Decorative Border
const DecorativeBorder: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.88 + 0.12 * Math.sin(frame * 0.08);
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

// Light leak overlay
const LightLeak: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = 0.09 + 0.04 * Math.sin(frame * 0.02);
  const x = Math.sin(frame * 0.008) * 15;
  const y = Math.cos(frame * 0.012) * 15;
  return (
    <div style={{
      position: 'absolute', inset: -60,
      background: 'radial-gradient(circle at 15% 25%, rgba(255, 215, 0, 0.18) 0%, rgba(236, 64, 122, 0.08) 45%, transparent 75%)',
      opacity,
      transform: `translate(${x}px, ${y}px) scale(1.08)`,
      mixBlendMode: 'color-dodge',
      pointerEvents: 'none',
      zIndex: 13,
    }} />
  );
};

// Simulated Audio visualizer bars
const AudioVisualizer: React.FC = () => {
  const frame = useCurrentFrame();
  const GOLD = '#E8C97D';
  const GOLD_BRIGHT = '#FFD700';
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
      opacity: 0.65,
    }}>
      {Array.from({ length: 12 }).map((_, i) => {
        const h = 6 + (Math.sin(frame * 0.28 + i * 0.45) * 0.5 + 0.5) * 22;
        return (
          <div key={i} style={{
            width: 4, height: h,
            borderRadius: '2px 2px 0 0',
            background: `linear-gradient(to top, ${GOLD}, ${GOLD_BRIGHT})`,
            boxShadow: `0 0 5px ${GOLD_BRIGHT}`,
          }} />
        );
      })}
    </div>
  );
};

// ==========================================
// 2. PARTICLE OVERLAY SYSTEMS
// ==========================================

// Traditional maggam work sparkles (4-point cross sparkles)
const Sparkle: React.FC<{ x: number; y: number; phase: number; size: number }> = ({ x, y, phase, size }) => {
  const frame = useCurrentFrame();
  const cycle = 60;
  const t = ((frame * 1.3 + phase) % cycle) / cycle;
  const opacity = t < 0.15 ? t / 0.15 : t < 0.6 ? 1 : (1 - t) / 0.4;
  const scale = t < 0.3 ? (1 - Math.pow(1 - t / 0.3, 4)) : 1;
  const GOLD_BRIGHT = '#FFD700';

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
          width: size * 0.2, height: size,
          marginLeft: -size * 0.1,
          marginTop: -size / 2,
          background: `linear-gradient(to bottom, transparent, ${GOLD_BRIGHT}, transparent)`,
          transform: `rotate(${rot}deg)`,
          transformOrigin: '50% 50%',
          boxShadow: `0 0 ${size}px ${GOLD_BRIGHT}`,
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
      y: ((i * 593 + 281) % (height - 400)) + 200,
      phase: i * 17.3,
      size: 6 + (i % 3) * 4,
    })),
  [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {sparks.map((s, i) => <Sparkle key={i} {...s} />)}
    </div>
  );
};

// 3D tumbling gold foil flakes falling down
const SHAPES = [
  'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
  'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  'polygon(25% 0%, 75% 0%, 100% 100%, 0% 100%)',
];

const GoldFlake: React.FC<{
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

  const opacity = 0.45 + 0.45 * Math.sin(frame * 0.07 + phase);
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
      boxShadow: '0 0 8px rgba(255, 215, 0, 0.4)',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
      pointerEvents: 'none',
      zIndex: 9,
    }} />
  );
};

const GoldFlakesField: React.FC<{ count?: number }> = ({ count = 24 }) => {
  const { width, height } = useVideoConfig();

  const flakes = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      x: (i * 227 + 53) % width,
      startY: (i * 383 + 97) % height,
      speed: 0.95 + (i % 5) * 0.35,
      size: 8 + (i % 7) * 4.5,
      phase: i * 14.7,
      rotSpeed: 1.2 + (i % 4) * 0.7,
      shapeIndex: i % SHAPES.length,
    })),
    [count, width, height]);

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 12 }}>
      {flakes.map((f, i) => <GoldFlake key={i} {...f} />)}
    </div>
  );
};

// ==========================================
// 3. KINETIC TYPOGRAPHY COMPONENTS
// ==========================================

const PremiumKineticText: React.FC<{ text: string; delay?: number; textColor?: string }> = ({ text, delay = 0, textColor = '#ffffff' }) => {
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
              fontSize: '52px',
              fontFamily: "'Segoe UI', sans-serif",
              // Use metallic gold for special keywords, otherwise white
              background: word.toUpperCase() === word && word.length > 2 ? GOLD_METALLIC : undefined,
              WebkitBackgroundClip: word.toUpperCase() === word && word.length > 2 ? 'text' : undefined,
              WebkitTextFillColor: word.toUpperCase() === word && word.length > 2 ? 'transparent' : textColor,
              filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.95))',
              fontWeight: 900,
              textTransform: 'uppercase',
              textShadow: word.toUpperCase() === word && word.length > 2 ? undefined : '0 4px 12px rgba(0,0,0,0.85)',
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ==========================================
// 4. MAIN SCENE RENDERING STAGE
// ==========================================

const SceneComponent: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();

  // Custom visual scaling/panning for images
  let imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    borderRadius: '16px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
  };

  if (scene.imageUrl) {
    if (scene.imageAnimation === 'zoom') {
      const scale = interpolate(frame, [0, scene.durationInFrames], [1, 1.15], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageStyle.transform = `scale(${scale})`;
    } else if (scene.imageAnimation === 'pan') {
      const translateX = interpolate(frame, [0, scene.durationInFrames], [-20, 20], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageStyle.transform = `translateX(${translateX}px) scale(1.08)`;
    }
  }

  // Entrance and exit fade for the entire scene background
  const sceneOpacity = interpolate(frame, [0, 10, scene.durationInFrames - 10, scene.durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ opacity: sceneOpacity }}>
      {/* Background Gradient */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${theme.backgroundGradientStart}, ${theme.backgroundGradientEnd})`,
          zIndex: 1,
        }}
      />

      {/* Blurred picture-in-picture background layout */}
      {scene.imageUrl && (
        <div 
          style={{
            position: 'absolute',
            inset: -20,
            backgroundImage: `url(${scene.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(38px) brightness(0.14) saturate(1.1)',
            transform: 'scale(1.12)',
            zIndex: 2,
          }}
        />
      )}

      {/* Ambient Radial Backglow */}
      <div style={{
        position: 'absolute',
        inset: 27,
        boxShadow: theme.template === 'luxury-gold-crazy' 
          ? 'inset 0 0 120px rgba(212, 175, 55, 0.22)' 
          : 'inset 0 0 90px rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Main image container with border frame */}
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
            border: '2.5px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 30px 60px rgba(0,0,0,0.85)',
          }}
        >
          <Img src={scene.imageUrl} style={imageStyle} />
        </div>
      )}

      {/* Render text overlay based on templates */}
      {scene.textOverlay && (
        theme.template === 'luxury-gold-crazy' ? (
          <PremiumKineticText text={scene.textOverlay} delay={8} textColor={theme.textColor} />
        ) : (
          <div style={{
            fontFamily: theme.fontFamily || 'sans-serif',
            color: theme.textColor || '#ffffff',
            fontSize: '56px',
            fontWeight: 800,
            textAlign: 'center',
            padding: '0 60px',
            lineHeight: 1.25,
            textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 0 40px rgba(0,0,0,0.5)',
            zIndex: 15,
            width: '100%',
            position: 'absolute',
            bottom: '18%',
            transform: scene.textAnimation === 'slide-up' 
              ? `translateY(${interpolate(frame, [0, 20], [40, 0], { extrapolateRight: 'clamp' })}px)`
              : undefined,
            opacity: interpolate(frame, [0, 15, scene.durationInFrames - 15, scene.durationInFrames], [0, 1, 1, 0])
          }}>
            {scene.textOverlay}
          </div>
        )
      )}
    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const theme = storyboard.visualTheme;
  let currentStartFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      
      {/* 1. Playback scenes sequence */}
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
          2. TEMPLATE-SPECIFIC FLOATING OVERLAYS
          ========================================== */}
      
      {/* Cinematic teal-orange look */}
      {theme.template === 'maggam-cinematic' && (
        <>
          <ColorGrade />
          <LensFlare />
          <FilmGrain />
          <Letterbox height={85} />
          <ThreadProgressBar />
          <SparkleField count={18} />
          <Watermark />
        </>
      )}

      {/* Gold foil flakes & luxury styling */}
      {theme.template === 'luxury-gold-crazy' && (
        <>
          <FilmGrain />
          <DecorativeBorder />
          <GoldFlakesField count={26} />
          <SparkleField count={20} />
          <LightLeak />
          <AudioVisualizer />
          <ThreadProgressBar />
          <Watermark />
        </>
      )}

      {/* Clean minimalist glow */}
      {theme.template === 'clean-glow' && (
        <>
          <ThreadProgressBar />
          <SparkleField count={10} />
          <Watermark />
        </>
      )}

    </AbsoluteFill>
  );
};
