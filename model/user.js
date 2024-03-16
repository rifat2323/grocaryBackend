const mongoose = require('mongoose')
const Product = require('./product.js')



const userSchema = new mongoose.Schema({

username:{
    type:String,
    required:true
},
password:{
    type:String,
    required:true
},
country:{
    type:String
},
city:{
    type:String
},
email:String,
cart:[
  {
  productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:Product
    },
    quantity:Number
  }
  
 ],
 Total:Number,
 refreshToken:String
})

 

const User = mongoose.model('User',userSchema)

module.exports = User