const mongoose = require('mongoose')

const User = require('./user.js')
const Product = require('./product.js')
const { type } = require('os')



const checkOutSchema = new mongoose.Schema({
    userId:{
         type:mongoose.Schema.Types.ObjectId,
         ref:User
    },
    product:[
        {
            productId:{
                type:mongoose.Schema.Types.ObjectId,
               ref:Product
               },
               quantity:Number
   
        }

    ],
    total:String,
    Date:{
        type:Date,
        default:new Date()
    },
    paymentId:String
       
   
})
const CheckOut = mongoose.model("CheckOut",checkOutSchema)

module.exports = CheckOut