import dotenv from 'dotenv';
import app from './app.js';
import { connectMongoDataBase } from './config/db.js';



//handle uncought exception error like varibales which are not defined



dotenv.config({ path: 'backend/config/config.env' });
import {v2 as cloudinary} from 'cloudinary';
connectMongoDataBase();


process.on('uncaughtException',(err) => {
   console.log(`Error :${err.message}`);
   console.log(`server is shutting down due to uncought exception error`);
   process.exit(1);
})

const PORT = process.env.PORT || 8000;

const server =app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});

//console.log(nymane);

process.on('uncaughtException',(err)=>{
  console.log(`Error :${err.message}`);
  console.log(`server is shutting down due to unhandlled promice rejection`);
  server.close(()=>{
    process.exit(1);
  })
})