const express = require("express")
// const path = require("path")
const app = express();

app.use(express.static("./public"))

// app.get('/',(req,res)=> res.sendFile(path.resolve("./navbar-app/index.html")))
app.get('/about',(req,res)=> res.send("About Page"))

app.all("*",(req,res)=> res.status(404).send('<h1>resource not found</h1>'))


app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))