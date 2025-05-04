const express = require('express');
const router = express.Router();
const path = require('path');

router.get(['/', '/index', '/index.html'], (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'), (err) => {
        if (err) {
            res.status(500).send('Error loading the page.');
        }
    });
});

module.exports = router;