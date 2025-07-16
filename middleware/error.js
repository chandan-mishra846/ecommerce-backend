import HandleError from "../utils/handleError.js";

export default (err, req,res,next)=>{
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "internal server error";

  if(err.name==='CastError'){
    const message =`this is invalid resource :${err.path}`;
    err = new HandleError(message,404)
  }

  //dublicate error key(same email)
  if(err.code===11000){
    const message =`this ${Object.keys(err.keyValue)} already registered`;
    err = new HandleError(message,400);
  }

  res.status(err.statusCode).json({
    success:false,
    message:err.message
  })
}