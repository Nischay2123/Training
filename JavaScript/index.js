// var x ;
// console.log(x);
// const arr = [1, 2, 3, 4, 5];
// console.log(arr);
// arr.push(7)
// console.log(arr);
// let obj = [1,2,3,4]
// console.log(obj);
// arr=obj
// console.log(arr);
// arr=[...arr,789]
// console.log([...arr, 8, 9]);
// console.log(arr);

// getName();
// function getName() {
//     console.log("Namesta Everyone");
// }

// const getName = function(){console.log("namesta everyone");
// }

// alert("i am javascript");

// x = 5;
// console.log(x);
// "use strict";
// const obj = {};
// Object.defineProperty(obj, "name", { value: "John", writable: false });
// obj.name = "Alex"; // ❌ TypeError: Cannot assign to read only property
// console.log(obj.name);

// "use strict"
// function marry(man, woman) {
//   woman.husband = man;
//   man.wife = woman;

//   return {
//     father: man,
//     mother: woman
//   }
// }

// let family = marry({
//   name: "John"
// }, {
//   name: "Ann"
// });

// console.log(family.father,family.mother);
// "use strict"
// console.log(this);
// const fn =function() {
//     console.log(this);
// }

// fn()

// let obj = {
//     name: "nischay",
//     fn: () => {
//         console.log(this);
//     }
// }

// obj.fn();

// let messages = [
//   {text: "Hello", from: "John"},
//   {text: "How goes?", from: "John"},
//   {text: "See you soon", from: "Alice"}
// ];
// let mp = new WeakMap();

// mp.set(messages[0])
// mp.set(messages[1])

// mp.set(messages[1])

// alert("message 0: " + mp.has(messages[0]));

// mp.shift(messages[0])

// class Animal {
//   static planet = "Earth";

//   constructor(name, speed) {
//     this.speed = speed;
//     this.name = name;
//   }

//   run(speed = 0) {
//     this.speed += speed;
//     alert(`${this.name} runs with speed ${this.speed}.`);
//   }

//   static compare(animalA, animalB) {
//     return animalA.speed - animalB.speed;
//   }

// }

// Inherit from Animal
// class Rabbit extends Animal {
//   hide() {
//     alert(`${this.name} hides!`);
//   }
// }

// let rabbits = [
//   new Rabbit("White Rabbit", 10),
//   new Rabbit("Black Rabbit", 5)
// ];

// rabbits.sort(Rabbit.compare);

// rabbits[0].run(); // Black Rabbit runs with speed 5.

// alert(Rabbit.planet); // Earth

// const obj = {
//     name: "nischay",
//     age: 21,
//     no: "8791574175"
// }

// const proxy = new Proxy(obj, {
//     get(targe, prop) {
//         if (prop in targe) {
//             return targe[prop]
//         }
//     }
// })

// function delay(f, ms) {
//   // return a wrapper that passes the call to f after the timeout
//   return function() { // (*)
//     setTimeout(() => f.apply(this, arguments), ms);
//   };
// }

// function sayHi(user) {
//   console.log(`Hello, ${user}!`);
// }

// // after this wrapping, calls to sayHi will be delayed for 3 seconds
// sayHi = delay(sayHi, 3000);

// sayHi("John"); // Hello, John! (after 3 seconds)

// let user = {
//   name: "nischay",
//   hi() { console.log(this.name); },
//   bye() { console.log("Bye"); }
// };

// user.hi(); // works

// // now let's call user.hi or user.bye depending on the name
// (user.name == "John" ? user.hi: user.bye).apply(user); // Error!

// function getData(callback) {
//   setTimeout(() => callback("Hello"), 1000);
// }

// function getdata() {
//   return new Promise(function getData(resolve, reject) {
//     setTimeout(() => resolve("Hello"), 1000);
//   });
// }



// function sum(a, b, c) {
//   return a + b + c;
// }


// const arr = [1, 2, 3, 4, 5, 6]

// arr.forEach(
//   (e) => {
//     if (e % 2 == 0) {
//       console.log(e);
//     }
//   }
// );



// function waitForTwoSeconds() {
//   return new Promise((resolve) => {
//     setTimeout(() => {
//       resolve("Done after 2 seconds");
//     }, 2000);
//   });
// }

// waitForTwoSeconds().then(console.log);


// Promise.resolve("Immediate success").then(console.log);

// Promise.reject("Immediate failure").catch(console.log);


// function getData() {
//   return new Promise(resolve => {
//     setTimeout(() => resolve("Data fetched"), 1000);
//   });
// }

// function processData(data) {
//   return new Promise(resolve => {
//     setTimeout(() => resolve(data + " and processed"), 1000);
//   });
// }

// getData()
//   .then(res => processData(res))
//   .then(final => console.log(final));



//   function readFile(callback) {
//   setTimeout(() => callback("File content"), 1000);
// }

// function readFilePromise() {
//   return new Promise(resolve => {
//     readFile(resolve);
//   });
// }

// readFilePromise().then(console.log);


// let animal = {
//   name: "Animal",
//   eat() {
//     console.log(`${this.name} eats.`);
//   }
// };

// let rabbit = {
//   __proto__: animal,
//   eat() {
//     // ...bounce around rabbit-style and call parent (animal) method
//     this.__proto__.eat.call(this); // (*)
//   }
// };

// let longEar = {
//   __proto__: rabbit,
//   eat() {
//     // ...do something with long ears and call parent (rabbit) method
//     this.__proto__.eat.call(this); // (**)
//   }
// };

// longEar.eat(); 



function multiply(a) {
  return function (b) {
    return a * b;
  }
}

const mutipleOFTwo = multiply(2);

console.log(mutipleOFTwo(3));



function logCalls(fn) {
  return function(...args) {
    console.log(`Calling ${fn.name} with`, args);
    return fn.apply(this, args);
  };
}

function add(a, b) {
  return a + b;
}

// const loggedAdd = logCalls(add)(2,3);

console.log( logCalls(add)(2,3)); // Logs call + returns 5

