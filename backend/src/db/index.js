import mongoose from 'mongoose'

let isConnected = false;
let connectionPromise = null;

const connectDb = async () => {
    // 1. If already connected, reuse
    if (mongoose.connection.readyState === 1) {
        isConnected = true;
        return;
    }

    // 2. If connection is already in progress, wait for it
    if (connectionPromise) {
        console.log("Waiting for existing MongoDB connection attempt...");
        await connectionPromise;
        return;
    }

    // 3. Start new connection attempt
    console.log("Starting new MongoDB connection...");
    try {
        mongoose.set('bufferCommands', false);

        connectionPromise = mongoose.connect(`${process.env.MONGODB_URL}`, {
            serverSelectionTimeoutMS: 5000,
        });

        const connectionInstance = await connectionPromise;
        isConnected = !!connectionInstance.connections[0].readyState;
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        connectionPromise = null; // Reset so next request can retry
        if (process.env.VERCEL !== '1') {
            process.exit(1);
        }
        throw error;
    } finally {
        connectionPromise = null; // Clear promise regardless of success
    }
}

export default connectDb;