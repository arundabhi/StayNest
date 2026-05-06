import mongoose from 'mongoose'

let isConnected = false;

const connectDb = async () => {
    // If already connected, reuse the connection
    if (isConnected) {
        console.log("Using existing MongoDB connection");
        return;
    }

    try {
        // Disable command buffering to avoid the 10s timeout error if not connected
        mongoose.set('bufferCommands', false);

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}`, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        });

        isConnected = !!connectionInstance.connections[0].readyState;
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        // Don't exit process in serverless, let the error propagate
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
        throw error;
    }
}

export default connectDb;