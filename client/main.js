const ok = document.querySelector('button.ok');
const heroes_button = document.querySelector('.heroes > button');
const heroes_value = document.querySelector('.heroes > div');
const inventory_button = document.querySelector('.inventory > button');
const inventory_value = document.querySelector('.inventory > div');
const players_button = document.querySelector('.players > button');
const players_value = document.querySelector('.players > div');
const items_button = document.querySelector('.items > button');
const items_value = document.querySelector('.items > div');
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
  });
})

heroes_button.addEventListener('click', () => {
  const tag = `parse&s=heroes&t=${token}`;
  get(tag).then(value => {
    heroes_value.textContent = value.message;
  })
})

inventory_button.addEventListener('click', () => {
  const tag = `parse&s=inventory&t=${token}`;
  get(tag).then(value => {
    inventory_value.textContent = value.message;
  })
})

players_button.addEventListener('click', () => {
  const tag = `parse&s=players&t=${token}`;
  get(tag).then(value => {
    players_value.textContent = value.message;
  })
})

items_button.addEventListener('click', () => {
  const tag = `parse&s=items&t=${token}`;
  get(tag).then(value => {
    items_value.textContent = value.message;
  })
})

