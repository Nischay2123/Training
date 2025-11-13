// window.open('https://javascript.info/', 'windowName', 'width=800,height=600')

// let newWin = window.open("about:blank", "hello", "width=200,height=200");

// newWin.document.write("Hello, world!");



let newWindow = open('/', 'example', 'width=300,height=300')
newWindow.focus();

alert(newWindow.location.href); // (*) about:blank, loading hasn't started yet

newWindow.onload = function() {
  let html = `<div style="font-size:30px">Welcome!</div>`;
  newWindow.document.body.insertAdjacentHTML('afterbegin', html);
};