const http = require("http");
const fs = require("fs")

http.createServer(function(req,res){
    // const text = fs.readFileSync('./content/Big.txt','utf-8');
    // res.end(text)

    const fileStream = fs.createReadStream("./content/Big.txt",'utf-8')
    fileStream.on("open",()=>{
        fileStream.pipe(res)
    })
    fileStream.on("error",err=> console.log(err))
})
.listen(5000);