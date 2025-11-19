const { writeFile ,readFile} = require('fs');
const util = require('util');

const readFilePromise = util.promisify(readFile)
const writeFilePromise = util.promisify(writeFile)

async function func() {
    try {
        const first =await readFilePromise("./JS/Training/Node_Express/content/first.txt",'utf-8');
        const second =await readFilePromise("./JS/Training/Node_Express/content/second.txt",'utf-8');
        await writeFilePromise("./JS/Training/Node_Express/content/content.txt",`This is awesome ${first} and $ second`);
        console.log(`result -- ${first} and ${second}`);
    } catch (error) {
        console.log(error);
    }
}

func()