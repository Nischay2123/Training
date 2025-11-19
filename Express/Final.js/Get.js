const express = require("express")
const {people} = require("./data")
const app = express();

app.get("/api/people",(req,res)=>{
    res.status(200).json({message:"send",data:people})
})



app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))