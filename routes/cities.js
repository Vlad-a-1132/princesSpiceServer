const router = require('express').Router();
const data = require('../data/russian-cities.json')

router.get('/', (_req, res) => {
    res.status(200).json(data);
})

module.exports = router;