// 업데이트 된 src/index.ts

import express from 'express';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import { createServer } from 'http';

// 생성한 슬랙앱에 대한 키값들
import CONFIG from '../config/bot.json';
/* 
  {
    "SIGNING_SECRET": "XXXX",
    "BOT_USER_OAUTH_ACCESS_TOKEN": "xoxb-XXXX"
  }
 */

// 슬랙에서 슬랙앱에게 접근가능한 엔드포인트를 만들기 위해 웹서버(express)를 사용
const app = express();

const slackEvents = createEventAdapter(CONFIG.SIGNING_SECRET);
const webClient = new WebClient(CONFIG.BOT_USER_OAUTH_ACCESS_TOKEN);

// 메시지 이벤트 구독하기
slackEvents.on('message', async (event) => {
  console.log(event);

  if (event.text == 'hi') {
    webClient.chat.postMessage({
      text: 'ok',
      channel: event.channel,
    });
  }
});

// 메지지 이벤트 엔드포인트를 express 에 등록하기
app.use('/slack/events', slackEvents.requestListener());

// express 웹 서버 실행
createServer(app).listen(3000, () => {
  console.log('run slack bot');
});