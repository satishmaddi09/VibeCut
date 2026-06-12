import { Composition, getInputProps } from 'remotion';
import { VideoComposition } from './VideoComposition';

export const RemotionRoot: React.FC = () => {
  // Retrieve properties passed via CLI (durationInFrames)
  const props = getInputProps() as any;
  const duration = props?.durationInFrames || 300;

  return (
    <>
      <Composition
        id="VideoComposition"
        component={VideoComposition}
        durationInFrames={duration}
        fps={30}
        width={1080}
        height={1920} // Portrait orientation (9:16) - premium for mobile
      />
    </>
  );
};
