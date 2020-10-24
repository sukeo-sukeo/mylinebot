'use strict';

const url = 'https://immense-temple-88625.herokuapp.com/callback'

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

  console.time('process-time');

  const reMess = event.message.text

  //data.jsにnameがあるか検索。
  //あればindexを返す。なければundefinedとなる
  let index = []
  monsterData.some((data, i) => {;
    const result = reMess.indexOf(data.name)
    //nameが見つかった場合
    if (result === 0) {
      //さらに'亜種'ワードが含まれていたら次にあるデータ（亜種が入っている）を出す
      if (reMess.includes('亜種')) {
        if (reMess === monsterData[i + 1].name) {
          index.push(i +  1)
          return true
        } else {
          index.push('そのモンスターに\n亜種はいないニャ')
          return true
        }
      }
      index.push(i)
      return true
    }
  })

  console.timeEnd('process-time');

  if (typeof index[0] === 'string') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: index[0]
    })
  }

  //data.jsにnameがない場合（indexがundefined）
  if (index[0] === undefined) {
    //受信ワードによる分岐処理
    const seMess = {}
    switch (reMess) {

      case '亜種': {
        const result = searchMonsterName(monsterData, '亜種')
        const arry = []
        result.forEach(idx => {
          arry.push(`${monsterData[idx].name}【${monsterData[idx].weak1},${monsterData[idx].weak2}】`)
        })
        seMess.type = 'text'
        seMess.text = '★亜種一覧ニャ\n【】は弱点ニャ！★' + '\n' + arry.join('\n')
        break
      }

      case '二つ名': {
        const result = searchMonsterName(monsterData, '二つ名')
        const arry = []
        result.forEach(idx => {
          arry.push(`${monsterData[idx].name}【${monsterData[idx].weak1},${monsterData[idx].weak2}】`)
        })
        seMess.type = 'text'
        seMess.text = '★強いやつらニャ\n【】は弱点ニャ！★' + '\n' + arry.join('\n')
        break
      }

      case '２つ名': {
        const result = searchMonsterName(monsterData, '二つ名')
        const arry = []
        result.forEach(idx => {
          arry.push(`${monsterData[idx].name}【${monsterData[idx].weak1},${monsterData[idx].weak2}】`)
        })
        seMess.type = 'text'
        seMess.text = '★強いやつらニャ\n【】は弱点ニャ！★' + '\n' + arry.join('\n')
        break
      }

      case 'ふたつな': {
        const result = searchMonsterName(monsterData, '二つ名')
        const arry = []
        result.forEach(idx => {
          arry.push(`${monsterData[idx].name}【${monsterData[idx].weak1},${monsterData[idx].weak2}】`)
        })
        seMess.type = 'text'
        seMess.text = '★強いやつらニャ\n【】は弱点ニャ！★' + '\n' + arry.join('\n')
        break
      }

      case 'いちらん': {
        const result = monsterData.map(data => {
          return `${data.name}【${data.weak1},${data.weak2}】`
        })
        seMess.type = 'text'
        seMess.text = `★モンスターぜんぶニャ\n【】は弱点ニャ！★\n${result.join('\n')}`
        break
      }

      case '一覧': {
        const result = monsterData.map(data => {
          return `${data.name}【${data.weak1},${data.weak2}】`
        })
        seMess.type = 'text'
        seMess.text = `★モンスターぜんぶニャ\n【】は弱点ニャ！★\n${result.join('\n')}`
        break
      }

      default: {
        seMess.type = 'text'
        seMess.text = '...?'
        break
      }
    }
    return client.replyMessage(event.replyToken, seMess)

  } else {
    // indexが返ってくれば該当indexのモンスターの弱点を返す
    const seMess = {
      type: 'text',
      text: `${monsterData[index[0]].name}だニャ！\n１番の弱点は【${monsterData[index[0]].weak1}】ニャ！\n\n２番目の弱点は【${monsterData[index[0]].weak2}】\n弱い部分は【${monsterData[index[0]].breakPoint}】\nまたの呼び名は【${monsterData[index[0]].nickname}】\n\n以上ニャ！`
    }
    return client.replyMessage(event.replyToken, seMess)
  }
}

//モンスター検索関数
const searchMonsterName = (datas, word) => {
  let monsterNames = []
  if (word === '二つ名') {
    datas.forEach((data, i) => {
      if(data.secondname) {
        monsterNames.push(i)
      }
    })
    return monsterNames
  }
  datas.forEach((data, i) => {
    if (data.name.includes(word)) {
      monsterNames.push(i)
    }
    if (data.name.includes(('希少種'))) {
      monsterNames.push(i)
    }
  })
  return monsterNames
}


// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});
