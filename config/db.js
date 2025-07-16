import mongoose from "mongoose";

export const connectMongoDataBase = () =>{

  mongoose.connect(process.env.db_URI).then((data) =>{
  console.log(`mongodb connected successfully on post ${data.connection.host}`);
  })

}

