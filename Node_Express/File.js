const fs = require('fs')
const path = require('path')

const first = fs.readFileSync(path.resolve("JS","Training","Node_Express","content","content.txt"),'utf-8')
const second = fs.readFileSync(path.resolve("JS","Training","Node_Express","content","second.txt"),'utf-8')

console.log(first, second);

fs.writeFileSync(path.resolve("JS","Training","Node_Express","content","first.txt"),`here is the result : ${first} , ${second}`,{flag:'a'})