/* eslint-disable unicorn/filename-case */
import {
  Weaver,
  WebContentAsMarkdown,
  UniversalWriter,
  UniversalChoreographer,
  UniversalDirector,
  AzureSpeech,
  StandardAssets,
  BingImageSearchAssetGenerator,
  BrowserAssetGenerator,
} from '@carlosdp/weaver';
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

const _handler: BackgroundHandler = async (event: HandlerEvent, _context: HandlerContext) => {
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
  const weaver = new Weaver({
    openaiApiKey: process.env.OPENAI_API_KEY!,
    supabaseUrl: process.env.VITE_SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    storageBucket: 'assets',
    storagePrefix: data.userId,
  });
  const puppeteerOptions = process.env.NETLIFY_DEV ? { executablePath: '/opt/homebrew/bin/chromium' } : undefined;

  const description =
    "A quick video summary of some web content the user doesn't have time to read, from the perspective of an interested 3rd party";
  const sceneTypes = [
    {
      id: 'image',
      description: 'Display an image full screen, specify which image in the description',
      schema: { image_id: { type: 'string' } },
    },
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
  await weaver.pipe(new UniversalChoreographer(sceneTypes));
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

  await client.from('saved_contents').insert({
    url: data.url,
    story: weaver.story,
  });
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
