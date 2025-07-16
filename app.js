import express from 'express';
import product from './routes/ProductRoutes.js';
import user from './routes/userRoutes.js';
import order from './routes/orderRoutes.js';
import errorHandleMiddleWare from '../backend/middleware/error.js'
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", product)
app.use("/api/v1", user)
app.use("/api/v1", order)



app.use(errorHandleMiddleWare)

export default app;
