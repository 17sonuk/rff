const express = require('express');
const router = express.Router();

let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

const logger = require('../../loggers/logger');
// get countries
router.get('/countries', async (req, res, next) => {
    try {
        let result = await Country.getAllCountries()
        let countries = new Array(result.length);
        for (let i = 0; i < result.length; i++) {
            countries[i] = {}
            countries[i].name = result[i].name;
            countries[i].phonecode = result[i].phonecode;
            countries[i].isoCode = result[i].isoCode;
	    countries[i].currency = result[i].currency;
            countries[i].flag = result[i].flag;
        }
        res.send(countries);
    }
    catch (err) {
        next(err)
    }
})

// get states
router.get('/states', async (req, res, next) => {
    try {
        let countryCode = req.query.countryCode;
        let result = await State.getStatesOfCountry(countryCode)
        let states = new Array();
        for (let i = 0; i < result.length; i++) {
            let stateData = {}
            stateData.name = result[i].name;
            stateData.isoCode = result[i].isoCode;
            stateData.countryCode = result[i].countryCode;
            states.push(stateData);
        }
        res.send(states)
    }
    catch (err) {
        next(err)
    }
})

// get cities
router.get('/cities', async (req, res, next) => {
    try {
        let countryCode = req.query.countryCode;
        let stateCode = req.query.stateCode;
        let result = await City.getCitiesOfState(countryCode, stateCode);
        res.send(result.map(city => city.name))
    }
    catch (err) {
        next(err)
    }
})

module.exports = router;
