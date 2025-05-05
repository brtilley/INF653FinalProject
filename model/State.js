const mongoose = require('mongoose');
const stateSchema = new mongoose.Schema({
    stateCode: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    funFacts: { type: [String] }
}, { collection: 'states' }); // Explicitly set the collection name

module.exports = mongoose.model('State', stateSchema);