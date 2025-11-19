const {writeFileSync} = require("fs")

for (let index = 0; index < 100000; index++) {
    writeFileSync("./JS/Training/Node_Express/content/Big.txt",`Hello World ${index}\n`,{flag:'a'})    
}