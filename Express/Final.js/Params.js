const express = require("express")
const {products} = require("./data")
const app = express();

app.get("/",(req,res)=>{
    res.send(`<h1>Home Page</h1><a href='/api/products'>products</a>`)
})


app.get("/api/products",(req,res)=>{
    const newProducts = products.map((product)=>{
        const {id,name, image}= product;
        return {id,name,image};
    })

    res.json(newProducts);
})

app.get("/api/product/:id",(req,res)=>{
    const {id} = req.params
    const newProducts = products.find((product)=> product.id == Number(id))

    newProducts? res.json(newProducts):res.status(404).json("Prodcut not exist");
})
app.get("/api/product/:id/reviews/:reviewId",(req,res)=>{
    console.log(req.params);
    res.send("Testing Something")
})

app.listen(8000,()=>console.log(`Server is running on http://localhost:8000`))