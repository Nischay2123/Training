const { log } = require('console');
const {readFile} = require('fs');

const getText = (path)=>{
    return new Promise((resolve, reject)=>{
        readFile(path,'utf-8',(err, result)=>{
            if (err) reject(err)
            else resolve(result)
        })
    })
}

// console.log("start");

getText("./JS/Training/Node_Express/content/first.txt")
.then(res => console.log(res))
.catch(err => console.log(err))

// console.log("end");
