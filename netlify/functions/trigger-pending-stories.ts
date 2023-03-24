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

const _handler: BackgroundHandler = async (_event: HandlerEvent, _context: HandlerContext) => {
  // const data = JSON.parse(event.body || '');
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
  const { data: savedContents, error: contentError } = await client.from('queued_contents').select('user_id');

  if (contentError) {
    throw new Error(contentError.message);
  }

  const userIds = new Set(savedContents.map(content => content.user_id));

  for (const userId of userIds) {
    // eslint-disable-next-line no-console
    console.log(`Triggering briefing for user ${userId}`);

    await axios.post(
      `${process.env.URL}/.netlify/functions/send-video-background`,
      { user_id: userId },
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
