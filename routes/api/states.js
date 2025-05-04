const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');
const data = {};
data.states = require('../../model/states.json');
const verifyStates = require('../../middleware/verifyStates'); // Keep this if needed elsewhere

// Middleware to validate the :state parameter
router.param('state', (req, res, next, state) => {
    const validStates = data.states.map(state => state.code); // Extract state codes from states.json
    console.log(`Validating state: ${state}`);
    console.log(`Valid states: ${validStates}`);
    if (!validStates.includes(state.toUpperCase())) {
        console.log('Invalid state abbreviation');
        return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
    }
    console.log('State is valid');
    next();
});

// Routes
router.route('/')
    .get(statesController.getAllStates);

router.route('/:state')
    .get(statesController.getState);

router.route('/:state/funfact')
    .get(statesController.getFunfact)
    .post(statesController.createNewFunfacts)
    .patch(statesController.updateFunfact)
    .delete(statesController.deleteFunfact);

router.route('/:state/capital')
    .get(statesController.getCapital);

router.route('/:state/nickname')
    .get(statesController.getNickname);

router.route('/:state/population')
    .get(statesController.getPopulation);

router.route('/:state/admission')
    .get(statesController.getAdmission);

module.exports = router;