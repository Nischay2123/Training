// let url = 'https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits';
// let response = await fetch(url);

// let commits = await response.json(); // read response body and parse as JSON

// console.log(commits[0].author.login);

// let url = 'https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits';
// let response = await fetch(url);

// let commits = await response.text(); // read response body as text

// console.log(commits.slice(0, 80) + '...');

// fetch('https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits')
//   .then(response => response.json())
//   .then(commits => console.log(commits[0].author.login));




// let response = await fetch('https://api.github.com/repos/javascript-tutorial/en.javascript.info/commits');

// // get one header
// console.log(response.headers.get('Content-Type')); // application/json; charset=utf-8

// // iterate over all headers
// for (let [key, value] of response.headers) {
//   console.log(`${key} = ${value}`);
// }



let user = {
  name: 'John',
  surname: 'Smith'
};

let response = await fetch('/article/fetch/post/user', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  },
  body: JSON.stringify(user)
});

let result = await response.json();
console.log(result.message);