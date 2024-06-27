import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.DB_URL}/${DB_NAME}`);
        console.log(connectionInstance);
    }
    catch(e){
        console.log("Error in connecting DB : ", e);
        throw e;
    }
}

export default connectDB;
