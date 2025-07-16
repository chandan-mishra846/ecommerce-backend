export default (myErronFun)=>(req, res, next)=>{
  Promise.resolve(myErronFun(req,res,next)).catch(next)
}
