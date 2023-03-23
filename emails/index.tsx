import { Button } from '@react-email/button';
import { Html } from '@react-email/html';
import * as React from 'react';

export type EmailProps = {
  videoUrl: string;
};

export const Email = ({ videoUrl }: EmailProps) => {
  return (
    <Html>
      <Button pX={20} pY={12} href={videoUrl} style={{ background: '#000', color: '#fff' }}>
        Watch Video
      </Button>
    </Html>
  );
};
