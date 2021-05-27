const express = require('express')
const Axios = require('axios').default
const FormData = require('form-data');
const router = express.Router()
var mmm = require('mmmagic')
Magic = mmm.Magic;

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

const virusScan = (req, res, next) => {
    if (!req.files || !req.files.uploadedFile) {
        let e = new Error('Please Upload a File');
        e.status = 400;
        return generateError(e, next)
    }

    const inputFile = req.files.uploadedFile
    // logger.debug(`FormData: ${JSON.stringify(inputFile, null, 2)}`);

    var bodyFormData = new FormData();
    bodyFormData.append('inputFile', inputFile.data, inputFile.name);
    bodyFormData.append('async', 'false');

    Axios({
        url: `https://api.virusscannerapi.com/virusscan`,
        method: 'post',
        headers: {
            'X-ApplicationID': '6285c3b1-39de-4cc7-b0b0-e80b83c6ac1e',
            'X-SecretKey': 'c9767ee1-dc90-48f0-92fe-60203eb4656d',
            "Content-Type": `multipart/form-data; boundary=${bodyFormData._boundary}`
        },
        data: bodyFormData
    }).then(response => {
        logger.debug(`Scan report: ${JSON.stringify(response.data, null, 2)}`);
        // logger.info(response.data);
        if (response.data.status === "File is clean") {
            logger.debug("========== Virus Scan Success =========")
            next()
        } else {
            let e = new Error('Infected file');
            e.status = 400;
            return generateError(e, next)
        }
    }).catch(error => {
        logger.error(error)
        let e = new Error('File scan failed. Please try again!');
        e.status = 500;
        return generateError(e, next)
    })
}

router.post("/upload", virusScan, (req, res, next) => {
    var validFiles = ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.binary.macroEnabled.12', 'application/vnd.ms-excel', 'application/vnd.ms-excel.sheet.macroEnabled.12']

    if (!req.files || !req.files.uploadedFile) {
        let e = new Error('Please Upload a File');
        e.status = 400;
        return generateError(e, next)
    }
    let file = { fileName: req.files.uploadedFile.name, fileData: req.files.uploadedFile.data.toString('base64'), fileSize: req.files.uploadedFile.size }
    file["fileHash"] = req.files.uploadedFile.md5
    var magic = new Magic(mmm.MAGIC_MIME_TYPE),
        buf = Buffer.from(file.fileData, 'base64');
    magic.detect(buf, function (err, result) {
        var regEx = /^[\w-]+\.(pdf|xls|xlsx|xlsb|xlsm)$/gi
        var pattern = regEx.test(req.files.uploadedFile.name)
        if (pattern && req.files.uploadedFile.size <= 1048576 && (validFiles.includes(req.files.uploadedFile.mimetype)) && req.files.uploadedFile.mimetype == result) {
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
            let err = new Error("File size limit exceed or Invalid file type or Corrupted File")
            err.status = 400
            generateError(err, next)
        }
    })
})

module.exports = router;