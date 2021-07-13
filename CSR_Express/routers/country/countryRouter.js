const express = require('express');
const router = express.Router();

//const { countryModel } = require('./models');

const logger = require('../../loggers/logger');
//const countryData = require('../../utils/country.json')

// get countries
// router.get('/countries', (req, res, next) => {
//     logger.debug("router-getCountries");
//     try {
//         // let result = countryData.map(elem => {
//         //     return {
//         //         "name": elem["name"],
//         //         "phone_code": elem["phone_code"]
//         //     }
//         // })
//         let result = await countryModel.find({})
//         res.send(result);
//     } catch (err) {
//         console.log(err)
//     }
// })

// // get states
// router.get('/states', (req, res, next) => {
//     logger.debug("router-getStates");

//     try {
//         let countryName = req.query.country;
//         // let result = []

//         // for (let country of countryData) {
//         //     if (country["name"] === countryName) {
//         //         result = country["states"].map(elem => {
//         //             return {
//         //                 "name": elem["name"]
//         //             }
//         //         })
//         //         break;
//         //     }
//         // }
//         let result = countryModel.find({})
//         res.send(result)
//     } catch (err) {
//         console.log(err)
//     }
// })

// // get cities
// router.get('/cities', (req, res, next) => {
//     logger.debug("router-getCities");

//     try {
//         let countryName = req.query.country;
//         let stateName = req.query.state;
//         // let result = []

//         // for (let country of countryData) {
//         //     if (country["name"] === countryName) {
//         //         for (let state of country["states"]) {
//         //             if (state["name"] === stateName) {
//         //                 result = state["cities"];
//         //                 break;
//         //             }
//         //         }
//         //         break;
//         //     }
//         // }
//         let result = countryModel.find({})
//         res.send(result)
//     } catch (err) {
//         console.log(err)
//     }
// })

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