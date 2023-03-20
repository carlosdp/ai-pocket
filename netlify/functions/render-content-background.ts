/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

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
  const { data: savedContent, error: contentError } = await client
    .from('saved_contents')
    .select('*')
    .eq('id', data.id)
    .single();

  if (contentError) {
    throw new Error(contentError.message);
  }

  try {
    const res = await axios.post(
      `https://api.runpod.ai/v1/${process.env.RUNPOD_RENDER_POD}/run`,
      {
        input: {
          story: JSON.stringify(savedContent.story),
          id: savedContent.id,
          user_id: '1',
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (res.status !== 200) {
      throw new Error(`Runpod API error: ${res.statusText}`);
    }

    const id = res.data.id;
    let tries = 0;

    while (tries < 100) {
      const statusRes = await axios.get(`https://api.runpod.ai/v1/${process.env.RUNPOD_RENDER_POD}/status/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.RUNPOD_API_KEY}`,
        },
      });

      if (statusRes.status !== 200) {
        console.error(`Runpod API error: ${statusRes.statusText}`);
      }

      if (statusRes.data.status === 'COMPLETED') {
        // eslint-disable-next-line no-console
        console.log(`saving render for request ${savedContent.id}`);

        // eslint-disable-next-line no-console
        console.log(statusRes.data.output);

        break;
      }

      if (statusRes.data.status === 'FAILED') {
        throw new Error(`Runpod API error: ${statusRes.data.error}`);
      }

      tries++;

      await new Promise(resolve => setTimeout(resolve, 10_000));
    }

    if (tries >= 100) {
      throw new Error('Runpod API error: timeout');
    }
  } catch (error) {
    // @ts-ignore
    console.error(JSON.stringify(error.response?.data));
    throw error;
  }
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
