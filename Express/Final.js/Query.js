const express = require("express")
const {products} = require("./data")
const app = express();

app.get("/",(req,res)=>{
    res.send(`<h1>Home Page</h1>`)
})


app.get("/api/query",(req,res)=>{
    const {limit,search} = req.query;
    console.log(req.query);
    let sortedProducts = [...products];

    if(search){
        sortedProducts=sortedProducts.filter((product)=>{
            return product.name.startsWith(search)
        })
    }
    if(limit){
        sortedProducts=sortedProducts.slice(0,Number(limit));
    }
    sortedProducts.length<1?res.status(200).json({message:"sucess",data:[]}) :res.status(200).json({message:"sucess",data:sortedProducts});
})

app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))