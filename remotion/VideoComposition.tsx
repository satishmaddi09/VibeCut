import React from 'react';
import { 
  AbsoluteFill, 
  Sequence, 
  Img, 
  spring, 
  useCurrentFrame, 
  useVideoConfig, 
  interpolate 
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
    backgroundGradientStart: '#8b5cf6',
    backgroundGradientEnd: '#ec4899',
    textColor: '#ffffff',
    fontFamily: 'Plus Jakarta Sans',
  },
  scenes: [
    {
      id: 1,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Welcome to the Future of Video",
      textAnimation: 'slide-up',
      imageAnimation: 'none',
    },
    {
      id: 2,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "Programmatic Rendering in the Cloud",
      textAnimation: 'zoom-in',
      imageAnimation: 'none',
    },
    {
      id: 3,
      durationInFrames: 90,
      imageIdx: -1,
      textOverlay: "100% Free, Auto-Cleaning Storage",
      textAnimation: 'fade',
      imageAnimation: 'none',
    }
  ]
};

const SceneComponent: React.FC<{ scene: SceneData; theme: VisualTheme }> = ({ scene, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Text Animations ---
  let textStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily || 'system-ui',
    color: theme.textColor || '#ffffff',
    fontSize: '72px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '0 60px',
    lineHeight: 1.3,
    textShadow: '0 4px 20px rgba(0,0,0,0.5)',
    zIndex: 10,
    width: '100%',
    position: 'absolute',
    bottom: '25%',
  };

  if (scene.textAnimation === 'fade') {
    const opacity = interpolate(frame, [0, 15, scene.durationInFrames - 15, scene.durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    textStyle.opacity = opacity;
  } else if (scene.textAnimation === 'slide-up') {
    const opacity = interpolate(frame, [0, 15, scene.durationInFrames - 15, scene.durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const translateY = interpolate(frame, [0, 20], [60, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    textStyle.opacity = opacity;
    textStyle.transform = `translateY(${translateY}px)`;
  } else if (scene.textAnimation === 'zoom-in') {
    const opacity = interpolate(frame, [0, 15, scene.durationInFrames - 15, scene.durationInFrames], [0, 1, 1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const scale = spring({
      frame,
      fps,
      config: { damping: 12 },
    });
    // Interpolate spring scale from 0 to 1, then scale out at end
    const endScale = interpolate(frame, [scene.durationInFrames - 15, scene.durationInFrames], [1, 0.85], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    textStyle.opacity = opacity;
    textStyle.transform = `scale(${frame > scene.durationInFrames - 15 ? endScale : scale})`;
  } else {
    // Instant
    const opacity = interpolate(frame, [0, 5, scene.durationInFrames - 5, scene.durationInFrames], [0, 1, 1, 0]);
    textStyle.opacity = opacity;
  }

  // --- Image Animations ---
  let imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '24px',
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
      const translateX = interpolate(frame, [0, scene.durationInFrames], [-30, 30], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
      imageStyle.transform = `translateX(${translateX}px) scale(1.1)`;
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

      {/* Blurred image background for premium picture-in-picture look */}
      {scene.imageUrl && (
        <div 
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${scene.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(40px) brightness(0.4)',
            transform: 'scale(1.1)',
            zIndex: 2,
          }}
        />
      )}

      {/* Soft neon overlay grid/patterns for "AI vibe" */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)',
          zIndex: 3,
        }}
      />

      {/* Main Image Container */}
      {scene.imageUrl && (
        <div 
          style={{
            position: 'absolute',
            top: '15%',
            left: '5%',
            right: '5%',
            height: '55%',
            zIndex: 4,
            overflow: 'hidden',
            borderRadius: '24px',
            border: '2px solid rgba(255,255,255,0.15)',
          }}
        >
          <Img src={scene.imageUrl} style={imageStyle} />
        </div>
      )}

      {/* Text Overlay */}
      {scene.textOverlay && (
        <h1 style={textStyle}>
          {scene.textOverlay}
        </h1>
      )}
    </AbsoluteFill>
  );
};

export const VideoComposition: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const theme = storyboard.visualTheme;
  
  let currentStartFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
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
    </AbsoluteFill>
  );
};
