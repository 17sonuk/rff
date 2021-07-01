const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');
const countryData = require('../../utils/country.json')

// get countries
router.get('/getCountries', (req, res, next) => {
    logger.debug("router-getCountries");

    let result = countryData.map(elem => {
        return {
            "name": elem["name"],
            "phone_code": elem["phone_code"]
        }
    })
    res.send(result);
})

// get states
router.get('/getStates', (req, res, next) => {
    logger.debug("router-getStates");

    let countryName = req.query.country;
    let result = []

    for (let country of countryData) {
        if (country["name"] === countryName) {
            result = country["states"].map(elem => {
                return {
                    "name": elem["name"]
                }
            })
            break;
        }
    }
    res.send(result)
})

// get cities
router.get('/getCities', (req, res, next) => {
    logger.debug("router-getCities");

    let countryName = req.query.country;
    let stateName = req.query.state;
    let result = []

    for (let country of countryData) {
        if (country["name"] === countryName) {
            for (let state of country["states"]) {
                if (state["name"] === stateName) {
                    result = state["cities"];
                    break;
                }
            }
            break;
        }
    }
    res.send(result)
})

module.exports = router;