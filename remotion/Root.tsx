import { Composition, getInputProps } from 'remotion';
import { VideoComposition, defaultStoryboard } from './VideoComposition';

export const RemotionRoot: React.FC = () => {
  // Retrieve properties passed via CLI or defaults
  const props = getInputProps() as any;
  const storyboard = props?.storyboard || defaultStoryboard;
  
  // Calculate total duration by adding up all scene frame counts
  const totalDuration = storyboard.scenes.reduce(
    (acc: number, scene: any) => acc + (scene.durationInFrames || 90),
    0
  );

  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={totalDuration}
        fps={30}
        width={1080}
        height={1920} // Portrait orientation (9:16) - premium for mobile
        defaultProps={{
          storyboard
        }}
      />
    </>
  );
};
