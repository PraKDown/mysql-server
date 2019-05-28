const button = document.querySelector('button.ok');

async function get(tags) {
  return await (await fetch(`http://localhost:3000/request?action=${tags}`)).json();
}

button.addEventListener('click', () => {
  // const tag = `create&u=${document.querySelector('input.login').value}&p=${document.querySelector('input.pass').value}`; 
  const tag = 'parse';
  get(tag).then(value => console.log(value));
})

