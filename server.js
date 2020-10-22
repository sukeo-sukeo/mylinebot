'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const app = express();
require('dotenv').config()

const monsterData = require('./data')


// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || process.env.DEV_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET || process.env.DEV_SECRET
};

// create LINE SDK client
const client = new line.Client(config);

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => {
      res.json(result)
    })
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});


// event handler
function handleEvent(event) {
   if (event.replyToken === '00000000000000000000000000000000') {
   return {}
 }
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  // create a echoing text message
  const reMess = event.message.text

  console.time('process-time');

  const serchMonster = (monsterDatas, tage) => {
    monsterDatas.some((monsterData, i) => {
      const result = tage.indexOf(monsterData.name)
      if (result === 0) {
        index.push(i)
        return true
      }
    })
  }

  console.timeEnd('process-time');

  let index = []
  serchMonster(monsterData, reMess)

  //送信メッセージ
  if(index[0] === undefined) {
    const seMess = {
      type: 'text',
      text: 'そんなモンスターいないニャ！'
    }
    return client.replyMessage(event.replyToken, seMess);
  } else {
    const seMess = {
      type: 'text',
      text: '弱点は' + '「 ' + monsterData[index[0]].weak1 + ' 」' + ' ニャ'
    }
    return client.replyMessage(event.replyToken, seMess);
  }

}


// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
