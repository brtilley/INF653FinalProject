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
    },
    funfacts: {
        type: [String]
    }
});

module.exports = mongoose.model('State', stateSchema);