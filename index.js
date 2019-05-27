const http = require('http');
const request = require('request-promise');
const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// const server = http.createServer(function(req, res) {
//   console.log(req.url);
//   res.writeHead(200, {'Content-Type': 'application/json'});
//   res.end(JSON.stringify({ 'head': 'top' }));
// })
// server.listen(3000);


async function parseHeroes() {
  let text = '';

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
        const url_image = `https://dota2.gamepedia.com/${elem.querySelector('td > a').getAttribute('href')}`;
        const name = elem.querySelector('b > a').textContent;
        const base_strength = elem.querySelector('td:nth-child(3)').textContent.split('\n')[0];
        const strength_growth = elem.querySelector('td:nth-child(4)').textContent.split('\n')[0];
        const base_agility = elem.querySelector('td:nth-child(5)').textContent.split('\n')[0];
        const agility_growth = elem.querySelector('td:nth-child(6)').textContent.split('\n')[0];
        const base_intelligence = elem.querySelector('td:nth-child(7)').textContent.split('\n')[0];
        const intelligence_growth = elem.querySelector('td:nth-child(8)').textContent.split('\n')[0];
        text += name + ';' + class_hero + ';' +  base_strength + ';' + strength_growth + ';' + base_agility + ';' + agility_growth + ';' + base_intelligence
        + ';' + intelligence_growth + ';' + url_image + '\n';
      }
    });
  }

  fs.writeFile('heroes.txt', text, (err, data) => {});
}

parseHeroes();

// request('https://dota2.ru/heroes/', (err, res, body) => {
//   if (err) return console.log(err);

//   const dom = new JSDOM(body);

//   const power = dom.window.document.querySelectorAll('div.lines > div:nth-child(2) > a');

//   power.forEach(element => {
//     console.log(element.dataset.title);
//   });
// })

console.log('Запустили');