const ok = document.querySelector('button.ok');
const heroes_button = document.querySelector('.heroes > button');
const heroes_value = document.querySelector('.heroes > div');
const steamitems_button = document.querySelector('.steamitems > button');
const steamitems_value = document.querySelector('.steamitems > div');
const players_button = document.querySelector('.players > button');
const players_value = document.querySelector('.players > div');
const items_button = document.querySelector('.items > button');
const items_value = document.querySelector('.items > div');
const matches_button = document.querySelector('.matches > button');
const matches_value = document.querySelector('.matches > div');
const statistics_button = document.querySelector('.statistics > button');
const statistics_value = document.querySelector('.statistics > div');
const test_button = document.querySelector('.test > button');
const test_value = document.querySelector('.test > div');
const indexes_button = document.querySelector('.indexes > button');
const indexes_value = document.querySelector('.indexes > div');
const time_button = document.querySelector('.time > button');
const time_value = document.querySelector('.time > div');
const dump_button = document.querySelector('.dump > button');
const dump_value = document.querySelector('.dump > div');
let token = '';

async function get(tags) {
  return await (await fetch(`http://localhost:3000/request?action=${tags}`)).json();
}

ok.addEventListener('click', () => {
  const tag = `create&u=${document.querySelector('input.login').value}&p=${document.querySelector('input.pass').value}`; 
  get(tag).then(value => {
    token = value.token;
    document.querySelector('div.authorization').style.display = 'none';
    document.querySelector('body > div:nth-child(3)').style.display = 'block';
    if (value.test === 1) document.querySelector('div.adminpanel').style.display = 'block';
  });
})

heroes_button.addEventListener('click', () => {
  const tag = `parse&s=heroes&t=${token}`;
  heroes_value.textContent = 'wait...';
  get(tag).then(value => {
    heroes_value.textContent = value.message;
  })
})

steamitems_button.addEventListener('click', () => {
  const tag = `parse&s=steamitems&t=${token}`;
  steamitems_value.textContent = 'wait...';
  get(tag).then(value => {
    steamitems_value.textContent = value.message;
  })
})

players_button.addEventListener('click', () => {
  const tag = `parse&s=players&t=${token}`;
  players_value.textContent = 'wait...';
  get(tag).then(value => {
    players_value.textContent = value.message;
  })
})

items_button.addEventListener('click', () => {
  const tag = `parse&s=items&t=${token}`;
  items_value.textContent = 'wait...';
  get(tag).then(value => {
    items_value.textContent = value.message;
  })
})

matches_button.addEventListener('click', () => {
  const tag = `generate&s=matches&t=${token}`;
  matches_value.textContent = 'wait...';
  get(tag).then(value => {
    matches_value.textContent = value.message;
  })
})

statistics_button.addEventListener('click', () => {
  const tag = `generate&s=statistics&t=${token}`;
  statistics_value.textContent = 'wait...';
  get(tag).then(value => {
    statistics_value.textContent = value.message;
  })
})

test_button.addEventListener('click', () => {
  const tag = `test&t=${token}`;
  test_value.textContent = 'wait...';
  get(tag).then(value => {
    test_value.textContent = value.message;
  })
})

time_button.addEventListener('click', () => {
  const tag = `time&t=${token}`;
  time_value.textContent = 'wait...';
  get(tag).then(value => {
    time_value.textContent = value.message;
  })
})

dump_button.addEventListener('click', () => {
  const tag = `dump&t=${token}`;
  dump_value.textContent = 'wait...';
  get(tag).then(value => {
    dump_value.textContent = value.message;
  })
})

indexes_button.addEventListener('click', () => {
  const tag = `indexes&t=${token}`;
  const names = [];
  get(tag).then(value => {
    for (let key in value.message[0]) {
      names.push(key);
    }
    const table = indexes_value.querySelector('table');
    value.message.forEach(element => {
      table.innerHTML += `<tr><td>${element[names[0]]}</td><td>${element[names[1]]}</td><td>${element[names[2]]}</td></tr>`;
    });
  })
})

