const express = require("express")
const {people} = require("./data")
const app = express();

app.use(express.static("./methods-public"))
app.use(express.urlencoded({extended:false}))
app.use(express.json())

app.get("/api/people",(req,res)=>{
    res.status(200).json({message:"send",data:people})
})
app.post("/api/people",(req,res)=>{
    const {name}= req.body
    // console.log(people);
    
    // console.log(p);
    
    if(name)return res.status(200).json({message:"send",person:name})
    res.status(400).json({success:false,msg:"please provide name value"})
})

app.post("/login",(req,res)=>{
    const {name }= req.body;
    if(name) return res.status(200).send(`Welcome ${name}`)
    res.status(400).send("Please Provide Creadentials")
})


app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))