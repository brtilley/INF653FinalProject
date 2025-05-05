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
    },
    nickname: {
        type: String
    },
    population: {
        type: Number
    },
    capital_city: {
        type: String
    },
    admission_date: {
        type: String
    },
    admission_number: {
        type: Number
    }
});

module.exports = mongoose.model('state', stateSchema);