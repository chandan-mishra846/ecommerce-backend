import mongoose from "mongoose";
const productSchema =new mongoose.Schema({
  name:{
    type:String,
    required:[true,'please enter product name'],
    trim:true
  },
  description:{
    type:String,
    required:[true,'please enter product description'],
    trim:true
  },
  price:{
    type:Number,
    required:[true,'please enter product price'],
    maxLength:[7,'price cannot exceed 7 digits']
  },
  ratings:{
    type:Number,
    default:0
  },
  image:[
    {
      public_id:{
        type:String,
        required:true
      },
      url:{
         type:String,
        required:true
      }
    }
  ],
  category:{
    type:String,
    required:[true,'please enter product category'],
  },
  stock:{
    type:Number,
    required:[true,'please enter product stock'],
    maxLength:[5,'stock cannot exceed 5 digits'],
    default:1
  },
  numberOfReviews:{
    type:Number,
    default:0
  },
  reviews:[
    {
      user:{
        type:mongoose.Schema.ObjectId,
        ref:"User",
        required:true
      },
      name:{
        type:String,
        required:true
      },
      rating:{
        type:Number,
        required:true
      },
      comment:{
        type:String,
        required:true
      }
    }
  ],
  user:{
   type:mongoose.Schema.ObjectId,
   ref:"user",
   required:true
  },
  createdAt:{
    type:Date,
    default:Date.now
  }
})

export default mongoose.model("Product",productSchema)