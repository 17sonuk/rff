const express = require('express')
const FormData = require('form-data');
const router = express.Router()

const fileService = require('../../service/fileService');
const { fieldErrorMessage, generateError } = require('../../utils/functions');
const logger = require('../../loggers/logger');


router.get("/getfile", (req, res, next) => {
    if (!req.query.fileHash) {
        return res.json(fieldErrorMessage('\'fileHash\''));
    }
    fileService.getFiles(req.query.fileHash)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.post("/upload", async (req, res, next) => {

    let e = new Error('');
    console.log('after error!!!')

    if (!req.files || !req.files.uploadedFile) {
        e.message = 'Please Upload a File';
        e.status = 400;
        return generateError(e, next)
    }

    let file = {
        fileName: req.files.uploadedFile.name,
        fileData: req.files.uploadedFile.data.toString('base64'),
        fileSize: req.files.uploadedFile.size
    }
    file["fileHash"] = req.files.uploadedFile.md5

    try {
        const isValidFile = await fileService.checkFormat(file.fileName, file.fileData, file.fileSize, req.files.uploadedFile.mimetype);

        console.log("is file valid?: ", isValidFile)

        if (isValidFile) {
            try {
                const data = await fileService.insertFile(file);
                return res.json(data)
            } catch (fileErr) {
                if (err['_message']) {
                    err.status = 400
                    err.message = err['_message'];
                }
                return next(err)
            }
        }

        e.message = "File size limit exceed or Invalid file type or Corrupted File"
        e.status = 400
        return generateError(e, next)
    } catch (err) {
        generateError(err, next)
    }
})

module.exports = router;