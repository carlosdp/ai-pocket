/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import { render } from '@react-email/render';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import { ServerClient } from 'postmark';

import { Email } from '../../emails';
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
  const { data: savedContents, error: contentError } = await client
    .from('queued_bookmarks')
    .select('*')
    .eq('user_id', data.user_id);

  if (contentError) {
    throw new Error(contentError.message);
  }

  const contents = savedContents.filter(content => content.story !== null).map(content => ({ id: content.id }));

  if (contents.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No contents to render');
    return;
  }

  const { data: briefing, error: briefingError } = await client
    .from('briefings')
    .insert({
      contents,
      user_id: data.user_id,
    })
    .select('id')
    .single();

  if (briefingError) {
    throw new Error(briefingError.message);
  }

  const { data: user, error: userError } = await client.from('users').select('*').eq('id', data.user_id).single();

  if (userError) {
    throw new Error(userError.message);
  }

  if (user.email && process.env.POSTMARK_API_KEY) {
    const screenshotKey = savedContents.find(
      content => content.story !== null && content.screenshot_key !== null
    )?.screenshot_key;

    let screenshotUrl = '';

    if (screenshotKey) {
      const { data: screenshot, error: screenshotError } = await client.storage
        .from('assets')
        .createSignedUrl(screenshotKey, 60 * 60 * 24 * 365);

      if (screenshotError) {
        throw new Error(screenshotError.message);
      }

      screenshotUrl = screenshot.signedUrl;
    }

    // turn screenshot Blob into data URL using Buffer
    const emailHtml = render(Email({ videoUrl: `${process.env.URL}/briefings/${briefing.id}`, screenshotUrl }));

    const postmarkClient = new ServerClient(process.env.POSTMARK_API_KEY);

    await postmarkClient.sendEmail({
      To: user.email,
      From: 'videos@overload.carlosdp.xyz',
      Subject: 'Your Daily Briefing',
      HtmlBody: emailHtml,
    });
  }
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
