const mongoose =  require('mongoose');
const {DB_URL} = require('./index')
const connectDB = async() =>{
    mongoose.set('strictQuery', true);
    const {connection} = await mongoose.connect(DB_URL);
    console.log(`MongoDB connected with ${connection.host}`);
} 
module.exports =  connectDB;