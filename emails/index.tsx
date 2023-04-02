import { Button } from '@react-email/button';
import { Html } from '@react-email/html';
import { Img } from '@react-email/img';
import * as React from 'react';

export type EmailProps = {
  videoUrl: string;
  screenshotUrl: string;
};

export const Email = ({ videoUrl, screenshotUrl }: EmailProps) => {
  return (
    <Html>
      <Img src={screenshotUrl} alt="Video Screenshot" width="168px" height="300px" />
      <Button pX={20} pY={12} href={videoUrl} style={{ background: '#000', color: '#fff' }}>
        Watch Briefing
      </Button>
    </Html>
  );
};
