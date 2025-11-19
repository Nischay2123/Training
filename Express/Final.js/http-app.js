const http = require("http")
const fs = require("fs");

const homePage = fs.readFileSync("./navbar-app/index.html")
const homeStyle = fs.readFileSync("./navbar-app/styles.css")
const logo = fs.readFileSync("./navbar-app/logo.svg")
const homeScript = fs.readFileSync("./navbar-app/browser-app.js")

const server = http.createServer((req,res)=>{
    console.log(req.url);
    // console.log(req.method);
    if (req.url === "/") {
        res.writeHead(200,{"content-type":'text/html'})
        res.write(homePage)
        res.end();   
    }else if (req.url === "/styles.css") {
        res.writeHead(200,{"content-type":'text/css'})
        res.write(homeStyle)
        res.end();
    }else if (req.url === "/logo.svg") {
        res.writeHead(200,{"content-type":'image/svg+xml'})
        res.write(logo)
        res.end();
    }else if (req.url === "/browser-app.js") {
        res.writeHead(200,{"content-type":'text/javascript'})
        res.write(homeScript)
        res.end();
    }
    else{
        res.writeHead(404,{"content-type":'text/html'})
        res.write('<h1>Page not Found</h1>')
        res.end();
    }
});

server.listen(5000);