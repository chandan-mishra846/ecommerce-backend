import mongoose from "mongoose";

export const connectMongoDataBase = () =>{

  mongoose.connect(process.env.db_URI).then((data) =>{
    console.log(`✅ MongoDB connected successfully on host: ${data.connection.host}`);
  }).catch((error) => {
    console.error('❌ MongoDB connection error:', error.message);
  });

}

