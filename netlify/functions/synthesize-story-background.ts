/* eslint-disable unicorn/filename-case */
import { HandlerEvent, HandlerContext, BackgroundHandler } from '@netlify/functions';
import { render } from '@react-email/render';
import * as Sentry from '@sentry/serverless';
import { createClient } from '@supabase/supabase-js';
import ffmpegPath from 'ffmpeg-static';
import { exec } from 'node:child_process';
import fs from 'node:fs';
import { promisify } from 'node:util';
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

  // download all videos, save to /tmp, return filepaths
  const videos = await Promise.all(
    contents.map(async content => {
      // use supabase library to download file from 'assets' bucket
      const { data: videoData, error: videoDownloadError } = await client.storage
        .from('assets')
        .download(content.video!);

      if (videoDownloadError) {
        throw new Error(videoDownloadError.message);
      }

      const videoPath = `/tmp/${content.id}.mp4`;

      // videoData Blob to array buffer
      const videoBuffer = await videoData.arrayBuffer();

      // write array buffer to file
      fs.writeFileSync(videoPath, Buffer.from(videoBuffer));

      return videoPath;
    })
  );

  // save video list for ffmpeg concat
  const videoList = '/tmp/video-list.txt';

  fs.writeFileSync(videoList, videos.map(p => `file ${p}`).join('\n'));

  // use ffmpeg to concat videos
  const concatPath = '/tmp/concat.mp4';
  const screenshotPath = '/tmp/screenshot.png';

  const execAsync = promisify(exec);

  await execAsync(`${ffmpegPath} -f concat -safe 0 -i ${videoList} -c copy -y ${concatPath}`);

  // get the first frame of the video to screenshotPath
  await execAsync(`${ffmpegPath} -i ${concatPath} -ss 00:00:00.000 -vframes 1 -y ${screenshotPath}`);

  const concatFile = fs.readFileSync(concatPath);
  const screenshotFile = fs.readFileSync(screenshotPath);

  // upload concat video to supabase storage
  const { error: uploadError } = await client.storage
    .from('assets')
    .upload(`${data.user_id}/stories/${video.id}.mp4`, concatFile, { contentType: 'video/mp4' });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { error: screenshotUploadError } = await client.storage
    .from('assets')
    .upload(`${data.user_id}/stories/${video.id}.png`, screenshotFile, { contentType: 'image/png' });

  if (screenshotUploadError) {
    throw new Error(screenshotUploadError.message);
  }

  await client
    .from('videos')
    .update({
      storage_key: `${data.user_id}/stories/${video.id}.mp4`,
      screenshot_storage_key: `${data.user_id}/stories/${video.id}.png`,
    })
    .eq('id', video.id);

  const { data: user, error: userError } = await client.from('users').select('*').eq('id', data.user_id).single();

  if (userError) {
    throw new Error(userError.message);
  }

  if (user.email) {
    const { data: screenshot, error: screenshotError } = await client.storage
      .from('assets')
      .createSignedUrl(`${data.user_id}/stories/${video.id}.png`, 60 * 60 * 24 * 365);

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
};

const handler = Sentry.AWSLambda.wrapHandler(_handler);

export { handler };
