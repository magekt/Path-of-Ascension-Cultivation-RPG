import mongoose from 'mongoose';

export async function connectDatabase(): Promise<void> {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/path-of-ascension');
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}
