export default (myErronFun)=>(req, res, next)=>{
  Promise.resolve(myErronFun(req,res,next)).catch(next)
} //this is a high order wraper function , if any error comes it will catch that error and pass to nest middleware
