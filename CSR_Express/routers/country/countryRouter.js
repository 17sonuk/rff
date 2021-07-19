const express = require('express');
const router = express.Router();

let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

//const { countryModel } = require('./models');

const logger = require('../../loggers/logger');
//const countryData = require('../../utils/country.json')

// get countries
router.get('/countries', async (req, res, next) => {
    logger.debug("router-getCountries");
    try {
        let result = await Country.getAllCountries()
        let countries = new Array(result.length);
        for (let i = 0; i < result.length; i++) {
            countries[i] = {}
            countries[i].name = result[i].name;
            countries[i].phonecode = result[i].phonecode;
            countries[i].isoCode = result[i].isoCode;
        }
        res.send(countries);
    }
    catch (err) {
        console.log(err)
        next(err)
    }
})

// get states
router.get('/states', async (req, res, next) => {
    logger.debug("router-getStates");
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
        console.log(err)
        next(err)
    }
})

// get cities
router.get('/cities', async (req, res, next) => {
    logger.debug("router-getCities");

    try {
        let countryCode = req.query.countryCode;
        let stateCode = req.query.stateCode;
        let result = await City.getCitiesOfState(countryCode, stateCode);
        res.send(result.map(city => city.name))
    }
    catch (err) {
        console.log(err)
        next(err)
    }
})

// // get cities
// router.post('/country-data', (req, res, next) => {
//     logger.debug("country-data");

//     const countryData = require('../../utils/country.json')
//     try {
//         let res = await countryModel.insertMany(countryData);
//         console.log(res);
//     } catch (err) {
//         console.log(err)
//     }

//     // let countryName = req.query.country;
//     // let stateName = req.query.state;
//     // let result = []

//     // for (let country of countryData) {
//     //     if (country["name"] === countryName) {
//     //         for (let state of country["states"]) {
//     //             if (state["name"] === stateName) {
//     //                 result = state["cities"];
//     //                 break;
//     //             }
//     //         }
//     //         break;
//     //     }
//     // }
//     // res.send(result)
// })

module.exports = router;