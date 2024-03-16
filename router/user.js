const express = require("express")
const User = require("../model/user.js")
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const stripe = require('stripe')(process.env.Strip)
const CheckOut = require('../model/checkoutInfo.js')

const total = (array)=>{
   return array.reduce((index,total)=>index + (total.productId.price * total.quantity),0)
}
const middleware = async (req,res,next)=>{
    const refreshToken = req.headers.refreshtoken
    if(!refreshToken || refreshToken.length <10) return res.status(404).send("can't find authorization")
  
   
  try{
    const verify = await jwt.verify(refreshToken,process.env.REFRESH_TOKEN )
      
    if(verify){
      req.token = refreshToken;
      next()
    
  }else{
   return res.status(403).send("can't find user")
  }
  }
  catch(error){
    return res.status(403).send("no user")
  }
   

}
router.get('/account', async(req,res)=>{
  const refreshToken = req.headers.refreshtoken

 
  if(!refreshToken || refreshToken.length <10) return res.status(404).send("can't find authorization")

  
  try{
    const verify = await jwt.verify(refreshToken,process.env.REFRESH_TOKEN)
   
    if(!verify) return res.status(404).send("can't find verify")
   const userInfo = await User.findOne({refreshToken:refreshToken})
   if(!userInfo) return res.status(404).send("can't find user")
   res.status(200).json(userInfo)
 
 }
catch(error){
    console.log(error)
    return res.status(500).send("can't login")
}




})
router.get('/getCart',middleware,async(req,res)=>{
  const token = req.token

  const userInfo = await User.findOne({refreshToken:token}).populate("cart.productId")
    const totals = total(userInfo.cart)
       userInfo.Total = totals
       userInfo.__v = 0
       await userInfo.save()
  return res.status(200).json({cart:userInfo.cart, total:userInfo.Total})
})
router.get('/checkout',middleware,async(req,res)=>{
  const token = req.token

  const userInfo = await User.findOne({refreshToken:token}).populate("cart.productId")
       
   const lineItem =  userInfo.cart.map((item)=>({
         price_data:{
            currency:"usd",
            product_data:{
                 name:item.productId.productName,
                 images :[item.productId.ProductImage[0].url],
                  

            } ,
            unit_amount:item.productId. price*100


         },
         quantity:item.quantity
    }))
       const data = await stripe.checkout.sessions.create({
           mode:"payment",
           line_items:lineItem,
           success_url:`${process.env.FONTEND}/success/{CHECKOUT_SESSION_ID}`,
           cancel_url :`${process.env.FONTEND}/cancel`,
           payment_method_types:['card']


       })
  return res.status(200).json(data)
})

router.get('/checkoutsuccess',middleware, async(req, res)=>{
  const token = req.token
  const id = req.query.id
   try{
    let userInfo = await User.findOne({refreshToken:token})
     const result = await stripe.checkout.sessions.retrieve(id)
     if(!result) return res.status(404).send("not paid")
     
       if(result.payment_status === 'paid'){
        userInfo = await User.findOne({refreshToken:token})
          const newCheckout = await CheckOut.create({
             userId:userInfo._id,
             product:userInfo.cart,
             total:userInfo.Total,
             paymentId:result.id

          })
          userInfo.cart = []
          userInfo.Total = 0
          await userInfo.save()
          res.status(200).json({success:true})
       }else{
        return res.status(200).send("not paid")
       }
      
     

   }catch(error){
    console.log(error)
    return res.status(500).send("server error: " + error)
   }



})

router.get('/getCartid',middleware,async(req,res)=>{
  const token = req.token

  const userInfo = await User.findOne({refreshToken:token})
    
      
  return res.status(200).json({cart:userInfo.cart })
})
router.get('/refresh',middleware, async(req,res)=>{
  const token = req.token

 try{
  const userInfo = await User.findOne({refreshToken:token})
  if(!userInfo) return res.status(404).send("can't find user")
  const accessToken = jwt.sign(
    {
      userInfo:{
          username:userInfo.username,
          email:userInfo.email
      }
    },
    process.env.ACCESS_TOKEN,
    {expiresIn:'1d'}

  )
  res.status(200).json({accessToken,city:userInfo.city})
 }catch(error){
  return res.status(500).send("error"+error)
 }


})
router.get('/logout',middleware, async(req,res)=>{
  const token = req.token
  try{
    const userInfo = await User.findOne({refreshToken:token})
    if(!userInfo) return res.status(404).send("can't find user")
      userInfo.refreshToken = ''
     await userInfo.save()
     res.status(200).send("logOut successfully")
  }catch(error){
    console.log(error)
    return res.status(500).send("error"+error)
  }
})
router.get("/addcart",async (req,res)=>{
  const id = req.query.id;
  const refreshToken = req.headers.refreshtoken
  if(!id) return res.status(404).send("need a id")
  if(!refreshToken || refreshToken.length <10) return res.status(404).send("can't find authorization")
   
   try{
     const verify = await jwt.verify(refreshToken,process.env.REFRESH_TOKEN)
    
     if(!verify) return res.status(404).send("can't find verify")
    const userInfo = await User.findOne({refreshToken:refreshToken})
    const alreadyExists = await userInfo.cart.find(item=>item.productId.toString()===id)
     if(alreadyExists) return res.status(408).send("already exists")
    const newCart = userInfo.cart.push({productId:id,quantity:1})
      await userInfo.save()
 
     return res.status(200).json(newCart)
   }catch(error){
     console.log(error)
     return res.status(500).send("server error: " + error)
 
   }
 
 })
router.post("/login", async(req,res)=>{

 const {username,password} = req.body
  if(!username || !password) return res.status(404).send("no username or password")

  try{
    const user = await User.findOne({username:username})
    if(!user) return res.status(406).send("no user found") // clint side pop up signup
     const match = await bcrypt.compare(password,user.password)
     if(!match ) return res.status(405).send("password mismatch")
     const accessToken = jwt.sign(
          {
            userInfo:{
                username:user.username,
                email:user.email
            }
          },
          process.env.ACCESS_TOKEN,
          {expiresIn:'1d'}
    
        )
     const refreshToken = jwt.sign(
          {
            userInfo:{
                username:user.username,
                email:user.password
            }
          },
          process.env.REFRESH_TOKEN,
          {expiresIn:'2d'}
    
        )
        user.refreshToken = refreshToken;
        await user.save();
        res.cookie("jwt",refreshToken,{httpOnly:true,maxAge:60*60*1000})
        res.cookie("access_token",accessToken,{maxAge:60*60*1000})

        res.status(200).json({accessToken,refreshToken,city:user.city})


  }catch(error){
    console.log(error)
    return res.status(500).send("server error"+error)
  }


})


router.post("/signup", async(req,res)=>{

 const {username,password,country,city,email} = req.body
  if(!username || !password || !country || !city || !email) return res.status(404).send("Please enter those value")
 try{
 const alreadyUser = await User.findOne({username:username})
 if(alreadyUser) return res.status(406).send("already found")
 const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g
  const test = regex.test(email)
  if(!test) return res.status(403).send("invalid email")
   const newPassword = await bcrypt.hash(password,10)
  const newUser = await User.create({
    username,
    password:newPassword,
    country,
    city,
    email
  })
  res.status(200).send(newUser)

} catch(error){
    console.log(error)
    return res.status(404).send("error: " + error)
}





})

router.put("/accountupdate", async(req,res)=>{
  const refreshToken = req.headers.refreshtoken
    const {username,country,city,email} = req.body

    

    if(!username  || !country || !city || !email) return res.status(404).send("Please enter those value")
  if(!refreshToken || refreshToken.length <10) return res.status(404).send("can't find authorization")

  try{
    const verify = await jwt.verify(refreshToken,process.env.REFRESH_TOKEN)
   
    if(!verify) return res.status(404).send("can't find verify")
   const userInfo = await User.findOne({refreshToken:refreshToken})
   if(!userInfo) return res.status(404).send("can't find user")
     userInfo.username = username;
   
    userInfo.email = email;
    userInfo.country = country;
    userInfo.city = city;
    await userInfo.save()
  res.status(200).send("updated successfully")


  }catch(error){
console.log(error)
return res.status(500).send("server error: " + error)

}
})



router.get("/incrisequantity",middleware,async(req,res)=>{
  const token  = req.token
  const id = req.query.id
 
  if(!id) return res.status(404).send("can't find id")
  const userInfo = await User.findOne({refreshToken:token}).populate("cart.productId")
  
    try{ 
     

       const findProduct = userInfo.cart.find(item=> item.productId._id.toString() === id)
       
      
       if(!findProduct) return res.status(405).send("can't find product")
          findProduct.quantity+=1
            const totals = total(userInfo.cart)
            userInfo.Total = totals
          await userInfo.save()
          res.status(200).send("successFully incrise product")
    }catch(error){

     return res.status(500).send("server error")

    }
  

})
router.get("/decrisequantity",middleware,async(req,res)=>{
  const token  = req.token
  const id = req.query.id
  if(!id) return res.status(404).send("can't find id")
  const userInfo = await User.findOne({refreshToken:token}).populate("cart.productId")
  
    try{

       const findProduct = userInfo.cart.find(item=> item.productId._id.toString() === id)
       if(!findProduct) return res.status(404).send("can't find product")
          findProduct.quantity-=1
            const totals = total(userInfo.cart)
            userInfo.Total = totals
          await userInfo.save()
          res.status(200).send("successFully decrise product")
    }catch(error){

     return res.status(500).send("server error")

    }
  

})
router.delete("/removeitem",middleware,async(req,res)=>{

  const token  = req.token
  const id = req.query.id

 
  if(!id) return res.status(404).send("can't find id")
 
  
    try{
      let userInfo = await User.findOne({refreshToken:token}).populate("cart.productId")
      if(!userInfo) return res.status(404).send("no user")
       userInfo.cart =  userInfo.cart.filter(item=> item._id.toString() !== id.toString())
       if (userInfo.cart.length < 0) return res.status(404).send("Can't find product")

       
        const totals = total(userInfo.cart)
          userInfo.Total = totals
        
          await userInfo.save()
          res.status(200).send("successFully remove product")
    }catch(error){
          console.log(error)
     return res.status(500).send("server error")

    }
  

})

module.exports = router
