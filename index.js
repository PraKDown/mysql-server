const express = require('express');
const request = require('request-promise');
const fs = require('fs');
const jsdom = require('jsdom');
const mysql = require('promise-mysql');
const cryptoRandomString = require('crypto-random-string');
const download = require('download');

const app = express();
const { JSDOM } = jsdom;

async function connect(u, p) {
  return await mysql.createConnection({
    host: 'localhost',
    user: u,
    password: p,
    database: 'anime'
  })
}

const connections = [];

// mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'anime'
// }).then(function(conn){
//   var result = conn.query('show profiles');
//   let k;
//   result.then(value => {
//     k = value;
//     console.log(value);
//   })
//   conn.end();
// });

async function parseInvent() {
  await download('https://market.dota2.net/itemdb/items_570_1559082507.csv', './base');
  mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'anime'
}).then(function(conn){
  conn.query(`LOAD DATA LOCAL INFILE './base/items_570_1559082507.csv' 
  INTO TABLE tab
  FIELDS TERMINATED BY ';' 
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES;`).then(() => console.log('ready'));
  conn.end();
});

}


async function parseHeroes() {
  let text = '';
  let id_hero = 0;

  await request('https://dota2.gamepedia.com/Strength', (err, res, body) => {
    if (err) return console.log(err);

    getData(new JSDOM(body), 'Strength');
  });

  await request('https://dota2.gamepedia.com/Agility', (err, res, body) => {
    if (err) return console.log(err);

    getData(new JSDOM(body), 'Agility');
  });

  await request('https://dota2.gamepedia.com/Intelligence', (err, res, body) => {
    if (err) return console.log(err);

    getData(new JSDOM(body), 'Intelligence');
  });

  function getData(dom, class_hero) {
    const rows = dom.window.document.querySelectorAll('table:nth-child(13) > tbody > tr');

    rows.forEach((elem, index) => {
      if (index !==0) {
        id_hero++;
        const url_image = `https://dota2.gamepedia.com/${elem.querySelector('td > a').getAttribute('href')}`;
        const name = elem.querySelector('b > a').textContent;
        const base_strength = elem.querySelector('td:nth-child(3)').textContent.split('\n')[0];
        const strength_growth = elem.querySelector('td:nth-child(4)').textContent.split('\n')[0];
        const base_agility = elem.querySelector('td:nth-child(5)').textContent.split('\n')[0];
        const agility_growth = elem.querySelector('td:nth-child(6)').textContent.split('\n')[0];
        const base_intelligence = elem.querySelector('td:nth-child(7)').textContent.split('\n')[0];
        const intelligence_growth = elem.querySelector('td:nth-child(8)').textContent.split('\n')[0];
        text += id_hero + ';' + name + ';' + class_hero + ';' +  base_strength + ';' + strength_growth + ';' + base_agility + ';' + agility_growth + ';' + base_intelligence
        + ';' + intelligence_growth + ';' + url_image + '\n';
      }
    });
  }

  fs.writeFile('./base/heroes.txt', text, (err, data) => {});
  return id_hero;
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/request', (req, res) => {
  const result = req.query;
  console.log(result);
  if (result.action === 'create') {
    connect(result.u, result.p).then(connector => {
      const token = cryptoRandomString({length: 10});
      const connection = {};
      connection[token] = connector;
      connections.push(connection)
      res.json({token: token});
    })
  } else if (result.action === 'parse') {
    // parseHeroes().then(value => {
    //   res.json({message: `${value} records updated`})
    // });
    parseInvent();
  }
})

app.listen(3000);

console.log('start server');