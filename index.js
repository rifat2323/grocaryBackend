const express = require("express")
const cookieParser = require("cookie-parser")
require("dotenv").config()
const app = express()
const mongoose = require("mongoose")
const db = require("./db/connectdb.js")
const cors = require("cors")
const{ rateLimit } = require('express-rate-limit')



const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 300, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
	
})
app.use(express.json({extended:true}))
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(limiter)
db()

app.use(cors({
    origin:["http://localhost:3000"],
   credentials:true
    
}))

app.get("/",(req,res)=>{
    
    res.sendStatus(200)
    console.log("hello")
})


app.use("/product", require("./router/product.js"))
app.use("/user",require('./router/user.js'))


mongoose.connection.once("open",()=>{
    console.log("connected")
    app.listen(4000,()=>{
        console.log("server runnnnnning 4000")
    })
})
