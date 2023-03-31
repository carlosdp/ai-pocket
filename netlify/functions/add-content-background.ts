/* eslint-disable unicorn/filename-case */
import {
  Weaver,
  WebContentAsMarkdown,
  UniversalWriter,
  UniversalDirector,
  AzureSpeech,
  StandardAssets,
  BingImageSearchAssetGenerator,
  BrowserAssetGenerator,
  Story,
} from '@carlosdp/weaver';
import { WeaverContext } from '@carlosdp/weaver/dist/src/context';
import { PipelineOperator } from '@carlosdp/weaver/dist/src/pipelineOperator';
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import { Canvas } from 'canvas';
import ffmpegPath from 'ffmpeg-static';
import { path as ffprobePath } from 'ffprobe-static';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import type { Database } from '../../src/supabaseTypes';

if (process.env.NODE_ENV === 'production') {
  Sentry.AWSLambda.init({
    dsn: process.env.FUNCTIONS_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1,
  });
}

export class SimpleChoreographer extends PipelineOperator {
  name = 'SimpleChoreographer';
  description = 'Just chooses the screenshot of the webpage';

  async generate(_context: WeaverContext, story: Story): Promise<Story> {
    if (!story.assets) {
      throw new Error('No assets found');
    }

    const assets = Object.values(story.assets).filter(a => a.type !== 'summary');
    const screenshot = assets.find(a => a.type === 'url' && a.description === 'Article Section');

    const scenes = story.blocks.map(s => ({ id: s.id, type: s.type, direction: s.direction }));
    // const sceneTypes = this.sceneTypes.map(s => ({ id: s.id, description: s.description, arguments: s.schema }));

    const sceneArgs = await Promise.all(
      scenes.map(async _scene => {
        return {
          url_id: screenshot?.id,
        };
      })
    );

    return {
      ...story,
      blocks: story.blocks.map((s, i) => ({ ...s, arguments: sceneArgs[i] })),
    };
  }
}

const _handler: BackgroundHandler = async (event: HandlerEvent, _context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return;
  }

  const data = JSON.parse(event.body || '');
  // const supabaseSession = event.headers['x-supabase-access-token'];

  const client = createClient<Database>(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // const userRes = await client.auth.getUser(supabaseSession);

  // const user = userRes.data.user;

  // if (!user) {
  //   return {
  //     statusCode: 401,
  //     body: JSON.stringify({ error: 'Unauthorized' }),
  //   };
  // }

  // const userDataRes = await client.from('users').select('*').eq('id', user.id).single();

  // const userData = userDataRes.data;

  // if (!userData.is_staff) {
  //   return {
  //     statusCode: 401,
  //     body: JSON.stringify({ error: 'Must be staff' }),
  //   };
  // }

  const { data: savedContent, error: savedContentError } = await client
    .from('saved_contents')
    .insert({
      url: data.url,
      user_id: data.user_id,
    })
    .select('id')
    .single();

  if (savedContentError) {
    throw new Error(savedContentError.message);
  }

  const weaver = new Weaver({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    storageBucket: 'assets',
    storagePrefix: data.user_id,
  });
  const puppeteerOptions = process.env.NETLIFY_DEV ? { executablePath: '/opt/homebrew/bin/chromium' } : undefined;

  const description =
    "Talk about the web content from the perspective of an interested 3rd party. Just get into the content, don't bother with an introduction or conclusion. Speak in complete sentences, and be concise.";
  const sceneTypes = [
    // {
    //   id: 'image',
    //   description: 'Display an image full screen, specify which image in the description',
    //   schema: { image_id: { type: 'string' } },
    // },
    {
      id: 'screenshot',
      description: 'Display a screenshot of a web page, specify which web page in the description',
      schema: { url_id: { type: 'string' } },
    },
  ];

  // eslint-disable-next-line no-console
  console.log('Grabbing content...');
  await weaver.pipe(new WebContentAsMarkdown(data.url, puppeteerOptions));
  // eslint-disable-next-line no-console
  console.log('Writing content...');
  await weaver.pipe(new UniversalWriter(description));
  // eslint-disable-next-line no-console
  console.log('Directing content...');
  await weaver.pipe(new UniversalDirector(sceneTypes, description));
  // eslint-disable-next-line no-console
  console.log('Choreographing content...');
  await weaver.pipe(new SimpleChoreographer());
  // eslint-disable-next-line no-console
  console.log('Generating assets...');
  await weaver.pipe(
    new StandardAssets({
      image: new BingImageSearchAssetGenerator(process.env.BING_IMAGE_SEARCH_KEY!),
      url: new BrowserAssetGenerator(puppeteerOptions),
    })
  );
  // eslint-disable-next-line no-console
  console.log('Generating speech...');
  await weaver.pipe(new AzureSpeech(process.env.AZURE_SPEECH_KEY!));

  await client.from('saved_contents').update({ story: weaver.story }).eq('id', savedContent.id);

  // eslint-disable-next-line no-console
  console.log('Rendering...');

  const execPromise = promisify(exec);

  const canvas = new Canvas(1080, 1920);
  const context = canvas.getContext('2d');

  const blocks = weaver.story.blocks;
  const fps = 30;
  let frameOffset = 0;

  const frameOutputPath = path.join(os.tmpdir(), 'frames');
  if (fs.existsSync(frameOutputPath)) {
    await fs.promises.rm(frameOutputPath, { recursive: true });
  }
  await fs.promises.mkdir(frameOutputPath, { recursive: true });

  const speeches: string[] = [];

  for (const [i, block] of blocks.entries()) {
    if (!block.speech) {
      continue;
    }
    // download speech from supabase storage
    const { data: speech, error: speechError } = await client.storage.from('assets').download(block.speech.asset.key);

    if (speechError) {
      throw new Error(speechError.message);
    }

    const speechBuffer = await speech?.arrayBuffer();

    // save speech to local file
    const speechPath = path.join(os.tmpdir(), `block_${i}_speech`);
    speeches.push(speechPath);
    await fs.promises.writeFile(speechPath, Buffer.from(speechBuffer!));

    // get duration of speech using ffprobe and execPromise
    const ffprobeOutput = await execPromise(
      `${ffprobePath} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${speechPath}`
    );

    const duration = Number.parseFloat(ffprobeOutput.stdout);
    const frames = Math.floor(duration * fps);

    // clear context
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let j = 0; j < frames; j++) {
      const output = canvas.toBuffer('image/png');
      const paddedNumber = String(frameOffset + j).padStart(6, '0');
      const framePath = path.join(frameOutputPath, `frame_${paddedNumber}.png`);
      await fs.promises.writeFile(framePath, output);
    }

    frameOffset += frames;
  }

  // use ffmpeg to render video using the frames and the speech files in sequence
  const videoPath = path.join(os.tmpdir(), 'video.mp4');
  await execPromise(
    `${ffmpegPath} -y -framerate ${fps} -i ${path.join(frameOutputPath, 'frame_%06d.png')} -i ${speeches.join(
      ' -i '
    )} -filter_complex "[1:a][2:a]amerge=inputs=2[aout]" -map 0:v -map "[aout]" -c:v libx264 -pix_fmt yuv420p -crf 23 -preset veryfast -shortest ${videoPath}`
  );

  // read file into buffer
  const videoBuffer = await fs.promises.readFile(videoPath);

  // upload video to supabase storage
  const videoStorageKey = `${data.user_id}/segments/${savedContent.id}.mp4`;
  await client.storage.from('assets').upload(videoStorageKey, videoBuffer, { contentType: 'video/mp4' });

  await client.from('saved_contents').update({ storage_key: videoStorageKey }).eq('id', savedContent.id);
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
