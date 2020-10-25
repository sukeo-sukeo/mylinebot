'use strict';

const url = 'https://return-weaknesses.herokuapp.com/callback'

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
      //さらに'希少種'ワードが含まれていたら次の次にあるデータ（希少種が入っている）を出す
      if (reMess.includes('希少種')) {
        if (reMess === monsterData[i + 2].name) {
          index.push(i +  2)
          return true
        } else {
          index.push('そのモンスターに\n希少種はいないニャ')
          return true
        }
      }
      index.push(i)
      return true
    }
  })

  console.timeEnd('process-time');
// 亜種がいないモンスターに亜種をつけて送信したとき
  if (typeof index[0] === 'string') {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: index[0]
    })
  }

  //data.jsにピンポイントでnameがない場合（indexがundefined）ワードによって表示を振り分ける
  if (index[0] === undefined) {
    //受信ワードによる分岐処理
    const seMess = {}
    switch (reMess) {

      case '説明':
      case 'せつめい':
      {
        seMess.type = 'text',
        seMess.text = `モンスター名を教えてくれれば\n弱点情報を教えるニャ！\n\nモンスター名はしっかり正確に教えてほしいニャ！\n\n正確な名前が分からなかったら...\n\n「一覧」\nで全モンスターの一覧を表示できるニャ\n\n「亜種」\nで亜種モンスターだけの一覧\n\n「二つ名」\nで漢字がつく強いモンスターだけの一覧\n\nをそれぞれ表示するニャ！\n\nおまけの機能として\n「通り名」\nで各モンスターのかっこいい別名を表示するニャ！\n\n以上ニャ！`
        break
      }

      case '亜種':
      case 'あしゅ':
       {
        const arry = serchMethod('亜種')
        seMess.type = 'text'
        seMess.text = '★亜種一覧ニャ\n【】は弱点ニャ！★' + '\n\n' + arry.join('\n') + '\n\n以上ニャ！'
        break
      }

      case '二つ名':
      case '２つ名':
      case '二つな':
      case '２つな':
      case 'ふたつな':
       {
        const arry = serchMethod('二つ名')
        seMess.type = 'text'
        seMess.text = '★強いやつらニャ\n【】は弱点ニャ！★' + '\n\n' + arry.join('\n') + '\n\n以上ニャ！'
        break
      }

      case '一覧':
      case 'いちらん':
       {
        const result = monsterData.map(data => {
          return `${data.name}【${data.weak1}】`
        })
        seMess.type = 'text'
        seMess.text = `★モンスターぜんぶニャ\n【】は弱点ニャ！★\n\n${result.join('\n')}\n\n以上ニャ！`
        break
      }

      case '異名':
      case '別名':
      case '通り名':
      case 'いみょう':
      case 'べつめい':
      case 'とおりな':
      {
       const result = monsterData.map(data => {
         return `${data.name}\n${data.nickname}\n`
       })
       seMess.type = 'text'
       seMess.text = `★かっこいい通り名一覧ニャ★\n\n${result.join('\n')}\n\n以上ニャ！`
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
    // indexが返ってくれば該当indexのモンスターの詳細データを返す
    const seMess = {
      type: 'text',
      text: `${monsterData[index[0]].name}だニャ...\n\n１番の弱点は【${monsterData[index[0]].weak1}】\n２番目の弱点は【${monsterData[index[0]].weak2}】ニャ！\n\n咆哮【${monsterData[index[0]]['咆哮']}】\n風圧【${monsterData[index[0]]['風圧']}】\n振動【${monsterData[index[0]]['振動']}】\n\nまたの呼び名は【${monsterData[index[0]].nickname}】\n\n`
    }
    //追加情報があれば表示
    if (monsterData[index[0]].info.length) {
      seMess.text = seMess.text + monsterData[index[0]].info + 'ニャ！\n\n'
    }
    //締めのセリフ
    seMess.text = seMess.text + '以上ニャ！'
    return client.replyMessage(event.replyToken, seMess)
  }
}

//モンスター検索関数を起動する関数
const serchMethod = (word) => {
  const result = searchMonsterName(monsterData, word)
  const arry = []
  result.forEach(idx => {
    arry.push(`${monsterData[idx].name}【${monsterData[idx].weak1}】`)
  })
  return arry
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
