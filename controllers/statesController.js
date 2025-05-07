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

        // Find the state's funfacts in MongoDB
        const mongoState = await State.findOne({ stateCode }).exec();
        console.log('MongoDB query result:', mongoState);

        if (mongoState && mongoState.funfacts) {
            state.funfacts = mongoState.funfacts; // Add funfacts from MongoDB to the state object
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

        if (!state) {
            console.log('State not found in MongoDB');
            return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
        }

        // Check if the state has fun facts
        if (!state.funfacts || state.funfacts.length === 0) {
            return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
        }

        // Generate a random fun fact
        const randomIndex = Math.floor(Math.random() * state.funfacts.length);
        const randomFunfact = state.funfacts[randomIndex];

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

        // Merge funfacts from MongoDB into jsonStates
        jsonStates = jsonStates.map(state => {
            const mongoState = mongoStates.find(mongo => mongo.stateCode === state.code);
            if (mongoState && mongoState.funfacts) {
                state.funfacts = mongoState.funfacts; // Add funfacts from MongoDB to the state object
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
const createNewFunfacts = async (req, res) => {
    try {
        // Validate stateCode
        if (!req?.params?.state) {
            return res.status(400).json({ message: 'State code required.' });
        }

        const stateCode = req.params.state.toUpperCase();

        // Query MongoDB for the state
        const state = await State.findOne({ stateCode }).exec();
        if (!state) {
            console.log('State not found in MongoDB');
            return res.status(404).json({ message: `No state matches code ${stateCode}.` });
        }

        // Validate request body
        if (!req.body.funfacts) {
            return res.status(400).json({ message: 'State fun facts value required' });
        }

        // Ensure funfacts is an array
        if (!Array.isArray(req.body.funfacts)) {
            return res.status(400).json({ message: 'State fun facts value must be an array' });
        }

        // Ensure funfacts array is not empty
        if (req.body.funfacts.length === 0) {
            return res.status(400).json({ message: 'State fun facts value required' });
        }


        // Add the new fun facts to the state's funfacts array
        if (!state.funfacts) {
            state.funfacts = []; // Initialize funfacts array if it doesn't exist
        }
        state.funfacts.push(...req.body.funfacts);

        // Save the updated state document
        await state.save();

        console.log(`Updated funfacts for ${state.state}:`, state.funfacts);
        res.json({
            message: `Fun Facts added for ${state.state}`,
            stateCode: state.stateCode,
            stateName: state.state,
            funfacts: state.funfacts
        });
    } catch (error) {
        console.error('Error in createNewFunfacts:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// PATCH
const updateFunfact = async (req, res) => {
    try {
        console.log(`State code: ${req.params.state}`);
        console.log(`Request body:`, req.body);

        // Validate stateCode
        if (!req?.params?.state) {
            return res.status(400).json({ message: 'State code required' });
        }

        const stateCode = req.params.state.toUpperCase();

        // Query MongoDB for the state
        const state = await State.findOne({ stateCode }).exec();
        if (!state) {
            console.log('State not found in MongoDB');
            return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
        }

        // Validate request body
        if (!req.body.index) {
            return res.status(400).json({ message: 'State fun fact index value required' });
        }
        if (!req.body.funfact) {
            return res.status(400).json({ message: 'State fun fact value required' });
        }

        // Validate funFacts array
        if (!state.funfacts || state.funfacts.length < 1) {
            return res.status(400).json({ message: `No Fun Facts found for ${state.state}` });
        }

        // Validate index
        if (req.body.index < 1 || req.body.index > state.funfacts.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}` });
        }

        // Adjust for zero-based indexing
        const correctedIndex = req.body.index - 1;

        // Update the fun fact
        state.funfacts[correctedIndex] = req.body.funfact;

        // Save the updated state document
        await state.save();

        console.log(`Updated funfacts for ${state.state}:`, state.funfacts);
        res.json({
            message: `Fun Facts added for ${state.state}`,
            stateCode: state.stateCode,
            stateName: state.state,
            funfacts: state.funfacts
        });
    } catch (error) {
        console.error('Error in updateFunfact:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// DELETE
const deleteFunfact = async (req, res) => {
    try {
        const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
        console.log(`State code: ${stateCode}`);
        console.log(`Request body:`, req.body);

        // Validate stateCode
        const state = await State.findOne({ stateCode }).exec();
        if (!state) {
            console.log('State not found in MongoDB');
            return res.status(404).json({ message: `No Fun Facts found for ${stateCode}` });
        }
        
        // Validate index in request body
        if (!req.body.index) {
            return res.status(400).json({ message: 'State fun fact index value required' });
        }

        // Validate funFacts array
        if (!state.funfacts || state.funfacts.length < 1) {
            return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
        }
        

        // Validate index
        if (req.body.index < 1 || req.body.index > state.funfacts.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${state.state}` });
        }

        // Adjust for zero-based indexing
        const correctedIndex = req.body.index - 1;

        // Remove the fun fact at the specified index
        state.funfacts.splice(correctedIndex, 1);

        // Save the updated state document
        await state.save();

        console.log(`Updated funfacts for ${state.state}:`, state.funfacts);
        res.json({
            message: `Fun Fact deleted for ${state.state}`,
            stateCode: state.stateCode,
            stateName: state.state,
            funfacts: state.funfacts
        });
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