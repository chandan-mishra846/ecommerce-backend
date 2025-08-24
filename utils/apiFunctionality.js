
class APIFunctionality{
  constructor(query, queryStr){
    this.query = query;
    this.queryStr = queryStr
  }
  search(){
    const keyword = this.queryStr.keyword?{
      name:{
        $regex:this.queryStr.keyword,
        $options:"i" //this is for case sensitive
      }
    }:{};
    this.query = this.query.find({...keyword});
    return this
  }

  filter(){
    const queryCopy = {...this.queryStr};
   

    const removeField = ["keyword","page","limit"];
    removeField.forEach(key=>delete queryCopy[key]);
    
    // Only apply filter if there are remaining query parameters
    if (Object.keys(queryCopy).length > 0) {
      this.query = this.query.find(queryCopy);
    }
    return this;
  }
  pagination(resultPerPage){
    const currentPage = Number(this.queryStr.page) || 1
    const skip = resultPerPage*(currentPage-1);  //number of products we have to skip
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}
export default APIFunctionality;