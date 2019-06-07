const express = require('express');
const request = require('request-promise');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const mysql = require('promise-mysql');
const cryptoRandomString = require('crypto-random-string');
const download = require('download');
const mysqldump = require('mysqldump');

const app = express();
const { JSDOM } = jsdom;
const connections = {};

let testing = 1;
let testresult = 0;

async function connect(u, p) {
  const connection = await mysql.createConnection({
    host: '185.127.25.72',
    user: u,
    password: p,
    database: 'gameservice'
  });
  const test = await connection.query(`select test from users where users.name = '${u}' COLLATE utf8mb3_bin;`);
  await connection.query('SET SESSION profiling = 1;');
  return [connection, test[0].test];
}

async function dump(token) {
  const connection = connections[token];
  const now = new Date();
  const name = `${now.getHours()}-${now.getMinutes()}.${now.getDate()}-${now.getMonth()}`;
  mysqldump({
    connection: connection.config,
    dumpToFile: `./dump/${name}.sql`,
  });
  return `${name}.sql`;
}

async function testconnections(token) {
  if (!connections.hasOwnProperty(token)) return;
  let opencoonections = [];
  let i = 0;
  let cond = true;
  while (cond) {
    await connect('prakdown', '123654ab')
      .then((connection) => {
        i++;
        opencoonections.push(connection);
      })
      .catch(() => {
        cond = false;
      })
  }
  opencoonections.forEach(elem => {
    elem.end();
  });
  return i;
}

async function parseItems(token) {
  const connection = connections[token];
  let id_items = 0;
  let text = '';
  await request('https://dota2.gamepedia.com/Items', (err, res, body) => {
    if (err) return console.log(err);
    const rows = (new JSDOM(body)).window.document.querySelectorAll('div.itemlist > div');
    rows.forEach((elem) => {
      id_items++;
      const name = elem.querySelector('a:nth-child(2)').textContent;
      const elem_value = elem.querySelector('span:nth-child(3)');
      let value = 0;
      if (elem_value !== null) value = +elem_value.textContent.split('(')[1].slice(0, -1);
      text += `${id_items};${name};${value}\n`
    })
  });
  fs.writeFileSync('./base/items.txt', text, (err, data) => {});
  await connection.query(`LOAD DATA LOCAL INFILE './base/items.txt' 
    INTO TABLE items
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return id_items;
}

async function parsePlayers(token) {
  const connection = connections[token];
  let id_player = 0;
  let text = '';
  await request('https://dota2.gamepedia.com/Professional_players', (err, res, body) => {
    if (err) return console.log(err);
    const rows = (new JSDOM(body)).window.document.querySelectorAll('table.wikitable > tbody > tr');
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
  });
  fs.writeFileSync('./base/players.txt', text, (err, data) => {});
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
  INTO TABLE steamitems
  FIELDS TERMINATED BY ';' 
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES;`);
  return await connection.query('SELECT COUNT(*) FROM steamitems').then(value => value[0]['COUNT(*)']);
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
  fs.writeFileSync('./base/heroes.txt', text, (err, data) => {});
  await connection.query(`LOAD DATA LOCAL INFILE './base/heroes.txt' 
    INTO TABLE heroes
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return id_hero;
}

async function generateMatches(token) {
  const connection = connections[token];
  const firstdate = 1264975200000;
  const lastdate = 1548968400000;
  let text = '';
  let match_id = 0;
  for (let i = 0; i < 100000; i++) 
  {
    match_id++;
    const startms =  Math.random() * (lastdate - firstdate) + firstdate;
    const startdate = new Date(startms);
    const enddate = new Date(startms + (Math.random() * (7200000 - 1200000) + 1200000));
    const randomvalue = Math.random() * (200 - 0) + 0;
    const enumvalue = randomvalue >= 100 ? 'Dire' : 'Radiant';
    const textstart = `${startdate.getFullYear()}-${('0' + startdate.getMonth()).slice(-2)}-${('0' + startdate.getDate()).slice(-2)} ${('0' + startdate.getHours()).slice(-2)}:${('0' + startdate.getMinutes()).slice(-2)}:${('0' + startdate.getSeconds()).slice(-2)}`;
    const textend = `${enddate.getFullYear()}-${('0' + enddate.getMonth()).slice(-2)}-${('0' + enddate.getDate()).slice(-2)} ${('0' + enddate.getHours()).slice(-2)}:${('0' + enddate.getMinutes()).slice(-2)}:${('0' + enddate.getSeconds()).slice(-2)}`;
    text += `${match_id};${textstart};${textend};${enumvalue}\n`;
  }
  fs.writeFileSync('./base/matches.txt', text, (err, data) => {});
  await connection.query(`LOAD DATA LOCAL INFILE './base/matches.txt' 
    INTO TABLE matches
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return match_id;
}

async function generateStatistics(token) {
  const connection = connections[token];
  const matches = (await connection.query('SELECT * FROM matches')).map(elem => elem.idmatches);
  const players = (await connection.query('SELECT * FROM players')).map(elem => elem.idplayers);
  const heroes = (await connection.query('SELECT * FROM heroes')).map(elem => elem.idheroes);
  const items = (await connection.query('SELECT * FROM items')).map(elem => elem.iditems);
  let text = '';
  matches.forEach((elem, index) => {
    let readyplayers = players.slice();
    let readyheroes = heroes.slice();
    for (let i = 0; i < 10; i++) {
      const idplayer = Math.round(Math.random() * (readyplayers.length - 1 - 0) + 0);
      const idhero = Math.round(Math.random() * (readyheroes.length - 1 - 0) + 0);
      const firstslot = Math.round(Math.random() * (items.length - 1 - 0) + 0);
      const secondslot = Math.round(Math.random() * (items.length - 1 - 0) + 0);
      const thirdslot = Math.round(Math.random() * (items.length - 1 - 0) + 0);
      const fourthslot = Math.round(Math.random() * (items.length - 1 - 0) + 0);
      const faction = i < 5 ? 'Radiant' : 'Dire';
      const kills = Math.round(Math.random() * (35 - 0) + 0);
      const death = Math.round(Math.random() * (35 - 0) + 0);  
      text += `${index + 1};${readyplayers[idplayer]};${readyheroes[idhero]};${faction};${kills};${death};${firstslot};${secondslot};${thirdslot};${fourthslot}\n`;
      readyplayers.splice(idplayer, 1);
      readyheroes.splice(idhero, 1);
    }
  })
  fs.writeFileSync('./base/statistics.txt', text, (err, data) => {});
  await connection.query(`LOAD DATA LOCAL INFILE './base/statistics.txt' 
    INTO TABLE statistics
    FIELDS TERMINATED BY ';' 
    LINES TERMINATED BY '\n'`);
  return matches.length * 10;
}

async function checkindexes(token) {
  const connection = connections[token];
  return await connection.query(`SELECT table_name AS 'Table',
  round((data_length / 1024 / 1024), 2) 'Data, MB',
  round((index_length / 1024 / 1024), 2) 'Index, MB'
  FROM information_schema.TABLES
  WHERE table_schema = 'gameservice';
  `);
}

async function checktime(token) {
  const connection = connections[token];
  const profiles = await connection.query('show profiles;');
  return profiles[profiles.length-1].Duration;
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/index.html'));
})

app.get('/main.js', (req, res) => {
  res.sendFile(path.join(__dirname+'/client/main.js'));
})

app.get('/request', (req, res) => {
  let test = false;
  const result = req.query;
  console.log(result);
  if (result.action === 'create') {
    connect(result.u, result.p).then(value => {
      const token = cryptoRandomString({length: 10});
      connections[token] = value[0];
      res.json({token: token, test: value[1]});
      res.end();
    })
  } else if (result.action === 'parse') {
    if (result.s === 'heroes') { 
      parseHeroes(result.t).then(value => {
      res.json({message: `${value} records`})
    });
    } else if (result.s === 'steamitems') {
      parseInvent(result.t).then((value) => {
        res.json({message: `${value} records`})
      });
    } else if (result.s === 'items') {
      parseItems(result.t).then((value) => {
        res.json({message: `${value} records`})
      });
    } else if (result.s === 'players') {
      parsePlayers(result.t).then((value) => {
        res.json({message: `${value} records`})
      });
    }
  } else if (result.action === 'generate') {
    if (result.s === 'matches') {
      generateMatches(result.t).then((value) => {
        res.json({message: `${value} records`})
      });
    } else if (result.s === 'statistics') {
      generateStatistics(result.t).then((value) => {
        res.json({message: `${value} records`})
      });
    }
  } else if (result.action === 'test') {
    if (testing === 1) {
      testing = 2;
      res.json({message: 'start test, try again in 5 minutes'});
      testconnections(result.t).then((value) => {
        testresult = value;
        testing = 3;
      })
    } else if (testing === 2) {
        res.json({message: 'test not completed, try again in 5 minutes'});
    } else {
      res.json({message: `${testresult} connections`});
      testing = 1;
    }
  } else if (result.action === 'indexes') {
    checkindexes(result.t).then((value) => {
      res.json({message: value});
    });
  } else if (result.action === 'time') {
    checktime(result.t).then((value) => {
      res.json({message: `${value.toFixed(2)}s`});
    });
  } else if (result.action === 'dump') {
    dump(result.t).then((value) => {
      res.json({message: `${value} create`});
    });
  }
})

app.listen(3000);
console.log('start server');