import express from "express";
import env from "dotenv"
import connectDB from "./src/utils/db.js";
import cors from 'cors';
import cookieParser from 'cookie-parser'
import morgan from "morgan"
import { createServer } from 'node:http';
import { initializeSocket } from "./src/sockets/socket.js";
import apiRoutes from "./src/routes/index.js";

const port = process.env.PORT ?? 8000
const corsOptions = {
    origin: [
      "http://localhost:5500",
      "http://localhost:4173",
      process.env.CLIENT_URL,
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
};

const app = express();
const server = createServer(app);
const io = initializeSocket(server, corsOptions);
app.set("io", io);

env.config()
connectDB(process.env.MONGOD_URI);

app.use(cors(corsOptions));

app.set("io", io);


app.use(express.json());
app.use(express.urlencoded({extended:true,limit:"16kb"}));
app.use(cookieParser());
app.use(morgan("tiny"))


app.use("/api/v1", apiRoutes);

app.get("/",(req,res)=>{
    res.send("Hello from the Server")
})




server.listen(port,()=> console.log(`Server is running on: http://localhost:${port}`));