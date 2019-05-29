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
    host: '185.127.25.72',
    user: u,
    password: p,
    database: 'gameservice'
  })
}

const connections = {};

async function parseItems(token) {
  const connection = connections[token];
  let id_items = 0;
  await request('https://dota2.gamepedia.com/Items', (err, res, body) => {
    if (err) return console.log(err);
    const rows = (new JSDOM(body)).window.document.querySelectorAll('div.itemlist > div');
    let text = '';
    rows.forEach((elem) => {
      id_items++;
      const name = elem.querySelector('a:nth-child(2)').textContent;
      const elem_value = elem.querySelector('span:nth-child(3)');
      let value = 0;
      if (elem_value !== null) value = +elem_value.textContent.split('(')[1].slice(0, -1);
      text += `${id_items};${name};${value}\n`
    })
    fs.writeFile('./base/items.txt', text, (err, data) => {});
  });

  await connection.query(`LOAD DATA LOCAL INFILE './base/items.txt' 
    INTO TABLE items
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return id_items;
}

async function parsePlayers(token) {
  const connection = connections[token];
  let id_player = 0;
  await request('https://dota2.gamepedia.com/Professional_players', (err, res, body) => {
    if (err) return console.log(err);
    const rows = (new JSDOM(body)).window.document.querySelectorAll('table.wikitable > tbody > tr');
    let text = '';
    rows.forEach((elem, index) => {
      if (index !== 0) {
        id_player++;
        const nickname = elem.querySelector('td:nth-child(1) a').textContent;
        const name = elem.querySelector('td:nth-child(2)').textContent;
        const country = elem.querySelector('td:nth-child(3)').textContent.slice(1);
        const team_elem = elem.querySelector('td:nth-child(4) a:nth-child(2)');
        let team = '';
        if (team_elem !== null) team = team_elem.textContent;
        text += `${id_player};${nickname};${name};${country};${team}\n`
      }
    })
    fs.writeFile('./base/players.txt', text, (err, data) => {});
  });
  await connection.query(`LOAD DATA LOCAL INFILE './base/players.txt' 
    INTO TABLE players
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return id_player;
}

async function parseInvent(token) {
  const connection = connections[token];
  let base = ''
  await request('https://market.dota2.net/itemdb/current_570.json', (err, res, body) => {
    base = JSON.parse(body).db;
  })
  await download(`https://market.dota2.net/itemdb/${base}`, './base');
  await connection.query(`LOAD DATA LOCAL INFILE './base/${base}' 
  INTO TABLE inventory
  FIELDS TERMINATED BY ';' 
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES;`);
  return await connection.query('SELECT COUNT(*) FROM inventory').then(value => value[0]['COUNT(*)']);
}


async function parseHeroes(token) {
  const connection = connections[token];
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
  await connection.query(`LOAD DATA LOCAL INFILE './base/heroes.txt' 
    INTO TABLE heroes
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
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
      connections[token] = connector;
      res.json({token: token});
    })
  } else if (result.action === 'parse') {
    if (result.s === 'heroes') { 
      parseHeroes(result.t).then(value => {
      res.json({message: `${value} records updated`})
    });
    } else if (result.s === 'inventory') {
      parseInvent(result.t).then((value) => {
        res.json({message: `${value} records updated`})
      });
    } else if (result.s === 'items') {
      parseItems(result.t).then((value) => {
        res.json({message: `${value} records updated`})
      });
    } else if (result.s === 'players') {
      parsePlayers(result.t).then((value) => {
        res.json({message: `${value} records updated`})
      });
    }
  }
})

app.listen(3000);

console.log('start server');