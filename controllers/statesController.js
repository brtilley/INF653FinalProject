const State = require('../model/State');
const statesJson = require('../model/states.json');
const jsonMessage = require('../middleware/jsonMessage');
const res = require('express/lib/response');
const getStateName = require('../middleware/getStateName');


/* const getAllStates = async (req, res) => {
    // grab states from MongoDb
    let mongoStates = await State.find();
    if (!mongoStates) return res.status(204).json({ 'message': 'No states found.' });
    // added to ensure jsonStates is refreshed to all states after multiple queries
    let jsonStates = statesJson;
    jsonStates.map(state => {
        // if mongoDB has funfacts, add them to states funfacts.
        for (let i = 0; i < mongoStates.length; i++) {
            // check if states in db has 'funfacts'
            if (mongoStates[i].stateCode === state.code && mongoStates[i].hasOwnProperty('funfacts')) {
                state.funfacts = mongoStates[i].funfacts
            }            
        };
    });


} */




/* const getState = async (req, res, next) => {
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `Invalid state abbreviation parameter` });
    }
    const jsonState = statesJson.find(s => s.code == req.params.state.toUpperCase());
    if (state.funfacts && state.funfacts.length > 0) { 
        const funfacts = state.funfacts;
        jsonState['funfacts'] = funfacts;
    }    
    res.json(jsonState); 
}*/

const getState = (req, res) => {
    try {
        const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
        console.log(`Looking for state: ${stateCode}`);

        // Find the state in states.json
        const state = statesJson.find(state => state.code === stateCode);
        if (!state) {
            console.log('State not found in states.json');
            return res.status(404).json({ message: 'State not found' });
        }

        console.log('State found:', state);
        res.json(state); // Return the state data as JSON
    } catch (error) {
        console.error('Error in getState:', error);
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

        // Return the filtered or full list of states
        res.json(jsonStates);
    } catch (error) {
        console.error('Error in getAllStates:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const getFunfact = (req, res) => {
    const stateCode = req.params.state.toUpperCase(); // Convert state code to uppercase
    console.log(`Looking for fun fact for state: ${stateCode}`);

    // Find the state in states.json
    const state = statesJson.find(state => state.code === stateCode);
    if (!state) {
        return res.status(404).json({ message: 'State not found' });
    }

    // Check if the state has fun facts
    if (!state.funfact || state.funfact.length === 0) {
        return res.status(404).json({ message: `No Fun Facts found for ${state.state}` });
    }

    // Generate a random fun fact
    const randomIndex = Math.floor(Math.random() * state.funfact.length);
    const randomFunfact = state.funfact[randomIndex];

    res.json({ funfact: randomFunfact });
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
    if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
    if (!state) {
        return res.status(400).json({ "message": `No state matches code ${req.params.state}.` });
    }

    // push the funfacts that the user supplied in the body
    // to the funfacts of the state.
    if (req.body.funfacts) {
        // CHECK TO ENSURE funfacts VALUE IS AN ARRAY
        if (Array.isArray(req.body.funfacts)) {
            state.funfacts.push(...req.body.funfacts);
        } else {
            return res.status(400).json({ 'message': 'State fun facts value must be an array' });
        }
        
    } else {
        return res.status(400).json({ 'message': `State fun facts value required`});
    }
    // save to the DB and store in result
    const result = await state.save();

    res.json(result);

}

// PATCH
const updateFunfact = async (req, res) => {
    try {
        // Validate stateCode
        if (!req?.params?.state) {
            return res.status(400).json({ message: 'State code required.' });
        }

        const stateCode = req.params.state.toUpperCase();
        const state = await State.findOne({ stateCode }).exec();
        if (!state) {
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
        const stateName = getStateName(state.stateCode); // Helper function to get state name
        if (!state.funfacts || state.funfacts.length < 1) {
            return res.status(400).json({ message: `No Fun Facts found for ${stateName}.` });
        }

        // Validate index
        if (req.body.index < 1 || req.body.index > state.funfacts.length) {
            return res.status(400).json({ message: `No Fun Fact found at that index for ${stateName}.` });
        }

        // Adjust for zero-based indexing
        const correctedIndex = req.body.index - 1;

        // Update the fun fact
        state.funfacts[correctedIndex] = req.body.funfact;

        // Save the updated state to the database
        const result = await state.save();

        res.json(result); // Return the updated state
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