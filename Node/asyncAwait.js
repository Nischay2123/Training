const {readFile} = require('fs');

const getText = (path)=>{
    return new Promise((resolve, reject)=>{
        readFile(path,'utf-8',(err, result)=>{
            if (err) reject(err)
            else resolve(result)
        })
    })
}

async function func(path="./JS/Training/Node_Express/content/first.txt") {
    try {
        const res =await getText(path);
        console.log(res);
    } catch (error) {
        console.log(error);
    }
}

func()