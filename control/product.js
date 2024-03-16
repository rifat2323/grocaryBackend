const Product = require("../model/product.js")

 const exclusive= async(req,res)=>{
 const sort = parseInt(req.query.sort)||"0"
 const cat = req.query.cat || ''
try{
let exclusive = await Product.find({Exclusive:true})
if(!exclusive) return res.status(404).send("can't find any products")

if(sort === 101){
  exclusive = exclusive.sort((a,b)=>a.price - b.price)
 }
 if(sort === 102){
  exclusive = exclusive.sort((a,b)=>b.price - a.price)
 }
 if(cat.length>0){
  exclusive = exclusive.filter(item=>cat.includes(item.Category))
 }
res.status(200).json(exclusive)

}catch(error){
    return res.status(500).send("server error"+error)
}



}

 
 const bestSell =  async(req,res)=>  {
  const sort = parseInt(req.query.sort)||"0"
 const cat = req.query.cat || ""
try{
let bestSell = await Product.find({BestSell:true})
if(bestSell.length ===0) return res.status(404).send("can't find any products")
if(sort === 101){
  bestSell = bestSell.sort((a,b)=>a.price - b.price)
 }
 if(sort === 102){
  bestSell = bestSell.sort((a,b)=>b.price - a.price)
 }
 if(cat.length>0){
  bestSell = bestSell.filter(item=>cat.includes(item.Category))
 }

res.status(200).json(bestSell)

}catch(error){
    return res.status(500).send("server error"+error)
}
    
    
    
    }  


const updateProduct = async(req,res)=>{
    const {Exclusive,BestSell} = req.body || false;
   const {id} = req.params
  
    try{
      const findProduct = await Product.findById(id)
      if(!findProduct) return res.status(404).send("Product not found")
       findProduct.Exclusive =Exclusive 
       findProduct.BestSell = BestSell
  
      await findProduct.save()
      res.status(200).send("Product upload saved")
    }catch(error){
  
     return res.status(500).send("server error"+error)
  
  
    }
  
  
  
  }
const categoryProduct = async(req,res)=>{
    const category = req.query.category
    const sort = parseInt(req.query.sort) || '0'
    try{
     let categoryProduct = await Product.find({Category:{$regex:category,$options:'i'}})
     if(!categoryProduct) return res.status(404).send("Product not found")
     if(sort === 101){
      categoryProduct = categoryProduct.sort((a,b)=>a.price - b.price)
     }
     if(sort === 102){
      categoryProduct = categoryProduct.sort((a,b)=>b.price - a.price)
     }
     res.status(200).json(categoryProduct)
    }catch(error){
     return res.status(500).send("server error"+error)
    }
  
  }

  const searchItem = async (req,res)=>{
    const {query} = req.query || "eggs"
    const sort = parseInt(req.query.sort)||"0"
   const cat = req.query.cat || ''
   console.log(cat)
    try{
  
     let findProduct = await Product.find({productName:{$regex:query,$options:'i'}})
     if(!findProduct)  return res.status(404).send("no product found")
     
if(sort === 101){
  findProduct = findProduct.sort((a,b)=>a.price - b.price)
 }
 if(sort === 102){
  findProduct = findProduct.sort((a,b)=>b.price - a.price)
 }
 if(cat.length>0){
  findProduct = findProduct.filter(item=>cat.includes(item.Category))
 }
      res.status(200).json(findProduct)
  
    }catch(error){
     return res.status(500).send("server error: " + error)
    }
  
  }

  const oneItem = async(req,res)=>{
    const {id} = req.params
      if(!id) return res.status(404).send("need id")
      try{
     const oneItem = await Product.findById(id)
     if(!oneItem) return res.status(404).send("no item find")
     res.status(200).json(oneItem)
     
     }catch(error){
        return res.status(500).send("server error"+error)
     }
  
  }
module.exports = {exclusive,bestSell,updateProduct,categoryProduct,searchItem,oneItem}