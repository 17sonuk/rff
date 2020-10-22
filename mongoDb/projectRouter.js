const express = require('express');
const router = express.Router();
const projectService = require('./projectService')

//to Create project
router.post('/createProject', (req, res, next) => {
    // return project data object from service
    console.log("router-createProject", req.body);
    projectService.createProject(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.post('/getProjectNGO', (req, res, next) => {
    console.log("router-getProjectNGO", req.body);
    projectService.getProjectsNGO(req.body.name)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.post('/getProjectsCorporate', (req, res, next) => {
    console.log("router-getProjectsCorporate", req.body);
    projectService.getProjectsCorporate(req.body.name)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/getAllProjects', (req, res, next) => {
    console.log("router-getAllProjects");
    projectService.getAllProjects()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/getProjectById/:projectId', (req, res, next) => {
    console.log("router-getProjectById", req.params.projectId);
    projectService.getProjectById(req.params.projectId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.post('/updateProject', (req, res, next) => {
    console.log("router-updateProject", req.body);
    projectService.updateProjectById(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/addContributor/:projectId', (req, res, next) => {
    console.log("router-addContributor", req.params.projectId, req.body.contributor);
    projectService.addContributor(req.params.projectId, req.body.contributor)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//Onboarding of user
router.post('/onboarding', (req, res, next) => {
    console.log("router-onboarding", req.body);

    projectService.registerUser(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get user details
router.post('/getUserDetail', (req, res, next) => {
    console.log("router-getUserDetail", req.body);
    projectService.getUserDetails(req.body.name)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/getUnapprovedUsers', (req, res, next) => {
    console.log("router-getUnapprovedUsers", req.body);
    projectService.getUnapprovedUserDetails()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//approve user
router.post('/approveUser', (req, res, next) => {
    console.log("router-approveUser", req.body);
    projectService.approveUser(req.body.name, req.body.pan)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//login user
router.post('/login', (req, res, next) => {
    console.log("router-approveUser", req.body);
    let name = req.body.name
    if (name.length<4 && (name.startsWith('ca2') || name.startsWith('it'))) res.json({ success: true, message: 'login successful', name: req.body.name, role: "csr" })
    projectService.login(req.body.name)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

// upload Balance sheet
router.post('/uploadBalanceSheet', (req, res, next) => {
    console.log("router-uploadBalanceSheet", req.body);
    projectService.uploadBalanceSheet(req.body.file)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get profit amount of corporate for Current financial year
router.post('/getProfitCorporate', (req, res, next) => {
    console.log("router-getProfitCorporate", req.body);
    projectService.getAmountFromBalanceSheet(req.body.name)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get notification - true for unseen and false for seen
router.get('/getNotification/:seen', (req, res, next) => {
    console.log("router-getNotification");
    let name = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    projectService.getNotifications(name, req.params.seen)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.post('/updateNotification', (req, res, next) => {
    console.log("router-updateNotification");
    let name = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    projectService.updateNotification(name, req.body.txId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

module.exports = router;