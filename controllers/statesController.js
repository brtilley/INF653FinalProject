const State = require('../model/State');
const statesJson = require('../model/states.json');
const jsonMessage = require('../middleware/jsonMessage');
const res = require('express/lib/response');


const getState = async (req, res) => {
    try {
        const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
        console.log(`Looking for state: ${stateCode}`);

        // Find the state in states.json
        const state = statesJson.find(state => state.code === stateCode);
        if (!state) {
            console.log('State not found in states.json');
            return res.status(404).json({ message: 'State not found' });
        }

        // Find the state's funFacts in MongoDB
        const mongoState = await State.findOne({ stateCode }).exec();
        console.log('MongoDB query result:', mongoState);

        if (mongoState && mongoState.funFacts) {
            state.funFacts = mongoState.funFacts; // Add funFacts from MongoDB to the state object
        }

        console.log('State found:', state);
        res.json(state); // Return the merged state data
    } catch (error) {
        console.error('Error in getState:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getFunfact = async (req, res) => {
    try {
        const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
        console.log(`Looking for fun fact for state: ${stateCode}`);

        // Find the state in MongoDB
        const state = await State.findOne({ stateCode }).exec();
        console.log('MongoDB query result:', state);

        // if (!state) {
        //     console.log('State not found in MongoDB');
        //     return res.status(404).json({ message: `No state matches code ${stateCode}.` });
        // }

        // Check if the state has fun facts
        if (!state.funFacts || state.funFacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${state.state}.` });
        }

        // Generate a random fun fact
        const randomIndex = Math.floor(Math.random() * state.funFacts.length);
        const randomFunfact = state.funFacts[randomIndex];

        res.json({ funfact: randomFunfact });
    } catch (error) {
        console.error('Error in getFunfact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getAllStates = async (req, res) => {
    try {
        // Initialize jsonStates with data from statesJson
        let jsonStates = [...statesJson];

        // Check for contig query parameter
        if (req.query.contig === 'true') {
            // Filter out Alaska (AK) and Hawaii (HI) for contiguous states
            jsonStates = jsonStates.filter(state => state.code !== 'AK' && state.code !== 'HI');
        } else if (req.query.contig === 'false') {
            // Include only Alaska (AK) and Hawaii (HI)
            jsonStates = jsonStates.filter(state => state.code === 'AK' || state.code === 'HI');
        }

        // Fetch all states from MongoDB
        const mongoStates = await State.find().exec();
        console.log('MongoDB query result:', mongoStates);

        // Merge funFacts from MongoDB into jsonStates
        jsonStates = jsonStates.map(state => {
            const mongoState = mongoStates.find(mongo => mongo.stateCode === state.code);
            if (mongoState && mongoState.funFacts) {
                state.funFacts = mongoState.funFacts; // Add funFacts from MongoDB to the state object
            }
            return state;
        });

        // Return the merged list of states
        res.json(jsonStates);
    } catch (error) {
        console.error('Error in getAllStates:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getCapital = async (req, res) => {
    jsonMessage(req, res, 'capital');
}

const getNickname = async (req, res) => {
    jsonMessage(req, res, 'nickname');
}

const getPopulation = async (req, res) => {
    jsonMessage(req, res, 'population');
}

const getAdmission = async (req, res) => {
    jsonMessage(req, res, 'admission');
}

// POST
const createNewFunfacts = (req, res) => {
    try {
        // Validate stateCode
        if (!req?.params?.state) {
            return res.status(400).json({ message: 'State code required.' });
        }

        const stateCode = req.params.state.toUpperCase();

        // Find the state in states.json
        const state = statesJson.find(state => state.code === stateCode);
        if (!state) {
            return res.status(404).json({ message: `No state matches code ${stateCode}.` });
        }

        // Validate request body
        if (!req.body.funfacts) {
            return res.status(400).json({ message: 'State fun facts value required.' });
        }

        // Ensure funfacts is an array
        if (!Array.isArray(req.body.funfacts)) {
            return res.status(400).json({ message: 'State fun facts value must be an array.' });
        }

        // Add the new fun facts to the state's funfact array
        if (!state.funfact) {
            state.funfact = []; // Initialize funfact array if it doesn't exist
        }
        state.funfact.push(...req.body.funfacts);

        console.log(`Updated funfacts for ${state.state}:`, state.funfact);
        res.json({ message: `Fun Facts added for ${state.state}`, funfacts: state.funfact });
    } catch (error) {
        console.error('Error in createNewFunfacts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// PATCH
const updateFunfact = (req, res) => {
    try {
        console.log(`State code: ${req.params.state}`);
        console.log(`Request body:`, req.body);

        // Validate stateCode
        if (!req?.params?.state) {
            return res.status(400).json({ message: 'State code required.' });
        }

        const stateCode = req.params.state.toUpperCase();

        // Find the state in states.json
        const state = statesJson.find(state => state.code === stateCode);
        if (!state) {
            console.log('State not found in states.json');
            return res.status(404).json({ message: `No state matches code ${stateCode}.` });
        }

        // Validate request body
        if (!req.body.index) {
            return res.status(400).json({ message: 'State fun fact index value required.' });
        }
        if (!req.body.funfact) {
            return res.status(400).json({ message: 'State fun fact value required.' });
        }

        // Validate funfacts array
        if (!state.funfact || state.funfact.length < 1) {
            return res.status(400).json({ message: `No Fun Facts found for ${state.state}.` });
        }

        // Validate index
        if (req.body.index < 1 || req.body.index > state.funfact.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}.` });
        }

        // Adjust for zero-based indexing
        const correctedIndex = req.body.index - 1;

        // Update the fun fact
        state.funfact[correctedIndex] = req.body.funfact;

        console.log(`Updated funfacts for ${state.state}:`, state.funfact);
        res.json({ message: `Fun Fact updated for ${state.state}`, funfacts: state.funfact });
    } catch (error) {
        console.error('Error in updateFunfact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// DELETE
const deleteFunfact = (req, res) => {
    try {
        const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
        console.log(`State code: ${stateCode}`);
        console.log(`Request body:`, req.body);

        // Validate stateCode
        const state = statesJson.find(state => state.code === stateCode);
        if (!state) {
            console.log('State not found in states.json');
            return res.status(404).json({ message: `No state matches code ${stateCode}.` });
        }

        // Validate index in request body
        if (!req.body.index) {
            return res.status(400).json({ message: 'State fun fact index value required' });
        }

        const stateName = state.state;
        if (!state.funfact || state.funfact.length < 1) {
            return res.status(400).json({ message: `No Fun Facts found for ${stateName}` });
        }

        if (req.body.index < 1 || req.body.index > state.funfact.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}` });
        }

        // Adjust for zero-based indexing
        const correctedIndex = req.body.index - 1;
        state.funfact.splice(correctedIndex, 1); // Remove the fun fact at the specified index

        console.log(`Updated funfacts for ${stateName}:`, state.funfact);
        res.json({ message: `Fun Fact deleted for ${stateName}`, funfacts: state.funfact });
    } catch (error) {
        console.error('Error in deleteFunfact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { 
    getAllStates,
    getState,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    getFunfact,

    createNewFunfacts,
    updateFunfact,
    deleteFunfact
};