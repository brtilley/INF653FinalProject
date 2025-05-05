const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stateSchema = new Schema({
    stateCode: {
        type: String,
        required: true,
        unique: true
    },
    state: {
        type: String,
        required: true
    },
    funFacts: {
        type: [String]
    }
});

module.exports = mongoose.model('State', stateSchema);