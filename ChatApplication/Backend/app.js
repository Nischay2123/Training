import express from "express";
import env from "dotenv"

env.config()

const app = express();
const port = process.env.PORT ?? 8000

app.get("/",(req,res)=>{
    res.send("Hello from the Server")
})


app.listen(port,()=> console.log(`Server is running on: http://localhost:${port}`));