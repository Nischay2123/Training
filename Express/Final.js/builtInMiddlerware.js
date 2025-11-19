const express = require("express")
const {products} = require("./data")
const morgan = require("morgan")
const app = express();
const {logger, authorize}= require("./logger")

// app.use([logger,authorize]);
// app.use("/api",logger);

app.use(morgan("tiny"))

app.get("/",(req,res)=>{
    res.send(`Home`)
})
app.get("/about",(req,res)=>{
    res.send(`About`)
})
app.get("/home",(req,res)=>{
    res.send(`About`)
})
app.get("/api/products",(req,res)=>{
    console.log(req.user);
    // console.log(express);
    
    res.send(`About app`)
})




app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))