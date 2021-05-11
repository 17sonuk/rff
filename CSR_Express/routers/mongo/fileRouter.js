const express = require('express')
const router = express.Router()

const fileService = require('../../service/fileService');
const { fieldErrorMessage, generateError } = require('../../utils/functions');


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


router.post("/upload", (req, res, next) => {
    var validFiles = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'application/vnd.ms-excel', 'application/vnd.ms-excel.sheet.macroEnabled.12']

    if (!req.files || !req.files.uploadedFile) {
        let e = new Error('Please Upload a File');
        e.status = 400;
        return generateError(e, next)
    }
    let file = { fileName: req.files.uploadedFile.name, fileData: req.files.uploadedFile.data.toString('base64'), fileSize: req.files.uploadedFile.size }
    file["fileHash"] = req.files.uploadedFile.md5
    if (req.files.uploadedFile.size <= 1048576 && (validFiles.includes(req.files.uploadedFile.mimetype))) {
        fileService.insertFile(file)
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
    }
    else {
        let err = new Error("File size limit exceed or Invalid file type")
        err.status = 400
        throw err
    }
})
module.exports = router;