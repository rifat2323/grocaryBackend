const mongoose = require('mongoose');
 const express = require('express')
const Product = require('../model/product.js');
const router = express.Router();
const multer  = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require("fs/promises")
const jwt = require('jsonwebtoken')

const {exclusive,bestSell,updateProduct,categoryProduct,searchItem,oneItem} = require('../control/product.js');


const storage = multer.diskStorage({

   destination: function(req,file,cb){
     cb(null,path.join(__dirname,'..','upload'))
   },

   filename: function(req,file,cb){
     cb(null,file.originalname)
   }
})

const upload = multer({storage:storage})

cloudinary.config({
 cloud_name:process.env.CLOUD_NAME,
 api_key:process.env.API_KEY,
 api_secret:process.env.API_SCERATE
})

router.get("/exclusive",exclusive)
router.get("/bestsell",bestSell)
router.get("/category",categoryProduct) //query Category
router.get("/search", searchItem) //query query
router.get("/getoneitem/:id",oneItem)
router.get("/reviews", async (req, res) => {
   const refreshToken = req.headers.refreshtoken;
   const id = req.query.id||0
   const number = parseInt(req.query.number);
 
   if (!refreshToken || refreshToken.length < 10) 
       return res.status(404).send("Can't find authorization");

   const verify = jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, decoded) => {
       if (err) 
           return res.status(403).send("Error occurred");

       let name = decoded.userInfo.username;
       
       return name; 
   });
   if (!verify) 
   return res.status(403).send("Can't verify");
  try{
 
  let product = await Product.findById(id)
   if(!product) return res.status(404).send("Product not found");
   const userReviw = product.ReviewArray.find(item=>item.username===verify)
     if(userReviw){
      userReviw.ReviewNumber= number
     }else{
      product.ReviewArray.push({username:verify,ReviewNumber:number})
      
     
   
     }
      const totalReviw = product.ReviewArray.reduce((index,number)=>index+number.ReviewNumber,0)/product.ReviewArray.length
        product.Review = totalReviw
     await product.save()
     
   res.status(200).json({product})
  }catch(error){
   console.log(error)
   return res.status(500).send("service error"+error)
  }
  
 
});

router.post("/",upload.array("image") ,async(req,res)=>{

   const {productName,price,Quantity,Category,ProductDetails} =  req.body

if(!productName || !price || !Quantity || !Category) return res.status(404).send("something is missing")
   let images = []

   try{
  if(!req.files ||  req.files.length === 0) return res.status(404).send("no image found")
   const filePaths = req.files.map(file=>file.path)

   for(let imagesPath of filePaths){
      try{
         const result = await cloudinary.uploader.upload(imagesPath,{
            resource_type:'image',
            public_id: req.body.public_id || undefined,
            folder:"grocery"
            
   
         });
        images.push({url:result.secure_url,publicId:result.public_id})
      
       fs.unlink(imagesPath)
      }catch(error){
         console.log(error)
         return res.status(500).send("server error: " + error)
      }

     
   }
   
   


   const newProduct = await Product.create({
   productName,
   ProductImage:images,
   price,
   Category,
   Quantity,
   ProductDetails,
  
   
   
   })

   

   res.status(200).json(newProduct)

   }catch(error){

      return res.status(500).send("server error"+error)
   }
   
})
router.put('/update/:id',updateProduct)


module.exports = router