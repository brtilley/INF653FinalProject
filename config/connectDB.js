const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        // console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
    // console.log('Connecting to MongoDB with URI:', process.env.DATABASE_URI);
};


module.exports = connectDB;