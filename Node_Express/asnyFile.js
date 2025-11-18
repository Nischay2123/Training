const fs = require("fs");

fs.readFile(
  "./JS/Training/Node_Express/content/first.txt",
  "utf-8",
  (err, result) => {
    if (err) {
      console.log(err);
      return;
    } else {
      const first = result
      fs.readFile(
        "./JS/Training/Node_Express/content/second.txt",
        "utf-8",
        (err, result) => {
          if (err) {
            console.log(err);
            return;
          } else {
            const second = result
            fs.writeFile("./JS/Training/Node_Express/content/readAsync.txt",`Here is the result : ${first} , ${second}`,(err, result)=>{
                if (err) {
                    console.log(err);
                    
                }else{
                    console.log(result);
                    
                }
            })
          }
        }
      );
    }
  }
);


const res = fs.readFile("./JS/Training/Node_Express/content/second.txt",'utf-8',(err,result)=> err?console.log(err):
 console.log(result)
)

console.log(res);
