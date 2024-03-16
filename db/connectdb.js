const mongoose = require('mongoose')


const db = ()=>{

    const dbUrl = process.env.DB_URL
     try{
        mongoose.connect(dbUrl)

     }catch(error){
       console.log(error)
     }
}

module.exports = db