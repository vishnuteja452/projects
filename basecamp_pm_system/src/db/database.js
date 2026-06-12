import mongoose from "mongoose";

const connectmongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.log("❌ MongoDB not connected:", error.message);
    process.exit(1);
  }
};

export default connectmongo;