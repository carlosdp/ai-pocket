/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import { render } from '@react-email/render';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
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

const postmarkClient = new ServerClient(process.env.POSTMARK_API_KEY!);

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
    .from('queued_contents')
    .select('*')
    .eq('user_id', data.user_id);

  if (contentError) {
    throw new Error(contentError.message);
  }

  const contents = savedContents
    .filter(content => content.storage_key !== null)
    .map(content => ({ id: content.id, video: content.storage_key }));

  if (contents.length === 0) {
    // eslint-disable-next-line no-console
    console.log('No contents to render');
    return;
  }

  const { data: video, error: videoError } = await client
    .from('videos')
    .insert({
      contents,
      user_id: data.user_id,
    })
    .select('id')
    .single();

  if (videoError) {
    throw new Error(videoError.message);
  }

  try {
    const res = await axios.post(
      `https://api.runpod.ai/v1/${process.env.RUNPOD_RENDER_POD}/run`,
      {
        input: {
          contents,
          id: video.id,
          user_id: data.user_id,
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
        console.log(`saving vidoe render for request ${video.id}`);

        await client
          .from('videos')
          .update({
            storage_key: statusRes.data.output.result,
            screenshot_storage_key: statusRes.data.output.screenshot,
          })
          .eq('id', video.id);

        const { data: user, error: userError } = await client.from('users').select('*').eq('id', data.user_id).single();

        if (userError) {
          throw new Error(userError.message);
        }

        if (user.email) {
          const { data: screenshot, error: screenshotError } = await client.storage
            .from('assets')
            .createSignedUrl(statusRes.data.output.screenshot, 60 * 60 * 24 * 365);

          if (screenshotError) {
            throw new Error(screenshotError.message);
          }

          // turn screenshot Blob into data URL using Buffer
          const emailHtml = render(
            Email({ videoUrl: `${process.env.URL}/videos/${video.id}`, screenshotUrl: screenshot.signedUrl })
          );

          await postmarkClient.sendEmail({
            To: user.email,
            From: 'videos@overload.carlosdp.xyz',
            Subject: 'Your saved content summary',
            HtmlBody: emailHtml,
          });
        }

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
