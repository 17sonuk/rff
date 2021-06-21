const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const commonService = require('../../service/commonService')

logger.debug('<<<<<<<<<<<<<< common router >>>>>>>>>>>>>>>>>')

//to save communities
router.post('/create', (req, res, next) => {
    // return project data object from service
    logger.debug(`router-createProject: ${JSON.stringify(req.body, null, 2)}`);

    projectService.createProject(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            // console.log(err['_message'].toString())
            next(err)
        })
})
