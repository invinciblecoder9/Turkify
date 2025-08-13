import express from "express"
import userRouter from "./routers/user"
import workerRouter from "./routers/worker"
import cors from "cors";
const app = express();

//console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); 
app.use(cors())

app.use("/v1/user", userRouter);
app.use("/v1/worker", workerRouter);

app.listen(3000)