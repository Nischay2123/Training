import mongoose from "mongoose";

const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri,{
      serverSelectionTimeoutMS: 3000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
