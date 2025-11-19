const { writeFile ,readFile} = require('fs').promises

async function func() {
    try {
        const first =await readFile("./JS/Training/Node_Express/content/first.txt",'utf-8');
        const second =await readFile("./JS/Training/Node_Express/content/second.txt",'utf-8');
        await writeFile("./JS/Training/Node_Express/content/content.txt",`This is awesome ${first} and $ second`);
        console.log(`result -- ${first} and ${second}`);
    } catch (error) {
        console.log(error);
    }
}

func()