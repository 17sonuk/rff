const express = require('express');
const router = express.Router();
const commonService = require('../../service/commonService')

//to save communities
router.post('/community', (req, res, next) => {
    // return project data object from service
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

//delete community
router.put('/community', (req, res, next) => {
    // return project data object from service
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
    commonService.updateCommunity(req.body.communityId, req.body.name, req.body.place, req.body.paymentDetails)
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
// router.get('/donor', (req, res, next) => {
//     // return project data object from service
//     commonService.getDonors()
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

module.exports = router;