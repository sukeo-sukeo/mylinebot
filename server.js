'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const app = express();

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
      const text = req.body.events[0].message.text

      res.json(text)
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
  const echo = { type: 'text', text: event.message.text };

  // use reply API
  return client.replyMessage(event.replyToken, echo);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
