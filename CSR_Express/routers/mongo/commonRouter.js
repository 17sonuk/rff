const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const commonService = require('../../service/commonService')

logger.debug('<<<<<<<<<<<<<< common router >>>>>>>>>>>>>>>>>')

//to save communities
router.post('/community', (req, res, next) => {
    // return project data object from service
    logger.debug(`router-createProject: ${JSON.stringify(req.body, null, 2)}`);

    commonService.saveCommunities(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

router.get('/community/all', (req, res, next) => {
    // return project data object from service
    logger.debug('router-getcommunities');

    commonService.getCommunities()
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

router.get('/community', (req, res, next) => {
    // return project data object from service
    logger.debug('router-getcommunity');

    commonService.getCommunity(req.query.communityId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

// router.get('/community', (req, res, next) => {
//     // return project data object from service
//     logger.debug('router-getcommunity');

//     commonService.getCommunity(decodeURIComponent(req.query.name), decodeURIComponent(req.query.place))
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => {
//             if (err['_message']) {
//                 err.status = 400
//                 err.message = err['_message'];
//             }
//             next(err)
//         })
// })

//delete community
router.put('/community', (req, res, next) => {
    // return project data object from service
    logger.debug('router-deleteCommunities', req.body);

    console.log(req.body)
    commonService.deleteCommunities(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})


//update
router.put('/update-community', (req, res, next) => {
    // return project data object from service
    logger.debug('router-updateCommunities', req.body);

    console.log(req.body)
    commonService.updateCommunity(req.body.communityId,req.body.name,req.body.place,req.body.paymentDetails)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

//get all communites from list
router.post('/community/listed', (req, res, next) => {
    logger.debug('router get-allcommunity');

    commonService.getListedCommunity(req.body, req.orgName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

//to get all donor details
router.get('/donor', (req, res, next) => {
    // return project data object from service
    logger.debug('router-getDonors');

    commonService.getDonors()
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

module.exports = router;