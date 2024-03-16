const mongoose = require("mongoose")



const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        required:true
    },
    ProductImage:{
        type:Array,
        required:true
    },
    price:Number,
    Quantity:String,
    Category:String,
    ProductDetails:String,
    Exclusive:Boolean,
    BestSell:Boolean,
    Review:{
        type:Number,
        default:1
    },
    ReviewArray:[
         {
           username:String,
            ReviewNumber:Number
         }
    ]
})

const Product = mongoose.model("Product",productSchema)

module.exports = Product