import mongoose from "mongoose";

export async function connectToMongoDB() {
  const uri = process.env.MONGODB_URI;

  mongoose.set("bufferCommands", false); // Disable buffering of commands

  mongoose.connection.on('connected', () => console.log('MongoDB connected'));
  mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));

  try {
    await mongoose.connect(uri!, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Exit the process with an error code
  }
}

export default connectToMongoDB;


