import express from "express";
import env from "dotenv"
import connectDB from "./src/utils/db.js";
import Users from "./src/routes/user.routes.js"
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from "morgan"

const app = express();

const port = process.env.PORT ?? 8000

env.config()
connectDB(process.env.MONGOD_URI)


app.use(cors({
    origin:"*",
    credentials:true
}));
app.use(express.json());
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser());
app.use(morgan("tiny"))


app.use("/api/v1/users",Users);

app.get("/",(req,res)=>{
    res.send("Hello from the Server")
})


app.listen(port,()=> console.log(`Server is running on: http://localhost:${port}`));