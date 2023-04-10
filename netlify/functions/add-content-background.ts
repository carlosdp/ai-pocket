/* eslint-disable unicorn/filename-case */
import {
  Weaver,
  WebContent,
  UniversalWriter,
  UniversalDirector,
  AzureSpeech,
  StandardAssets,
  BingImageSearchAssetGenerator,
  BrowserAssetGenerator,
  Story,
} from '@carlosdp/weaver';
import { WeaverContext } from '@carlosdp/weaver/dist/src/context';
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';

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

export class SimpleChoreographer {
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

  const { data: bookmark, error: bookmarkError } = await client
    .from('bookmarks')
    .insert({
      url: data.url,
      user_id: data.user_id,
    })
    .select('id')
    .single();

  if (bookmarkError) {
    throw new Error(bookmarkError.message);
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
    'Personality: professional briefer for an important executive. Brief on the key points about this content.';
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
  await weaver.pipe(new WebContent(data.url, puppeteerOptions));

  await client
    .from('bookmarks')
    .update({
      title: weaver.story.metadata?.title,
      story: weaver.story,
    })
    .eq('id', bookmark.id);

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
  await weaver.pipe(
    new AzureSpeech(process.env.AZURE_SPEECH_KEY!, undefined, { name: 'en-US-AriaNeural', style: 'newscast-casual' })
  );

  const firstImageKey = weaver.story.blocks[0]?.arguments?.url_id;
  let screenshotKey: string | null = null;

  if (firstImageKey) {
    screenshotKey = weaver.story.assets?.[firstImageKey]?.storage?.key ?? null;
  }

  await client.from('bookmarks').update({ screenshot_key: screenshotKey, story: weaver.story }).eq('id', bookmark.id);
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
