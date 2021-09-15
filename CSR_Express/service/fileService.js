const Axios = require('axios').default
var mmm = require('mmmagic')
Magic = mmm.Magic;

require('dotenv').config();
const { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_BUCKET_NAME } = process.env;

const AWS = require('aws-sdk');
AWS.config.update({ region: AWS_REGION });

const { fileModel } = require('../model/models')

const fileService = {};

fileService.insertFile = (file, fileHash) => {
    return new Promise((resolve, reject) => {

        const s3 = new AWS.S3({
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        });

        const fileData = Buffer.from(file.data, 'binary');

        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: fileHash, // File hash/name you want to save as in S3
            Body: fileData,
            Metadata: { fileName: file.name, fileSize: `${file.size}` },
        };
        //ContentType: file.mimetype, //optional param attibute for S3.

        // Uploading files to the bucket
        s3.upload(params, function (err, data) {
            if (err) {
                reject(err);
            }
            let insertFileResponse = {
                fileName: file.name,
                fileHash: fileHash,
                fileSize: file.size
            }
            resolve(insertFileResponse)
        });
    })
}

fileService.getFiles = (fileHash) => {

    return new Promise((resolve, reject) => {

        const s3 = new AWS.S3({
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY
        });

        const params = {
            Bucket: AWS_BUCKET_NAME,
            Key: `${fileHash}`
        };

        s3.getObject(params, function (err, data) {
            if (err) {
                reject(err)
            }

            let getFileResponse = {
                fileName: data.Metadata['fileName'],
                fileData: data['Body'].toString('base64'),
            }
            resolve(getFileResponse)
        });
    });
}

fileService.virusScan = (req, res, next) => {
    if (!req.files || !req.files.uploadedFile) {
        let e = new Error('Please Upload a File');
        e.status = 400;
        return generateError(e, next)
    }

    const inputFile = req.files.uploadedFile
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
        if (response.data.status === "File is clean") {
            next()
        } else {
            let e = new Error('Infected file');
            e.status = 400;
            return generateError(e, next)
        }
    }).catch(error => {
        let e = new Error('File scan failed. Please try again!');
        e.status = 500;
        return generateError(e, next)
    })
}

fileService.checkFormat = async (fileName, fileData, fileSize, mimeType) => {
    const validMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.binary.macroEnabled.12',
        'application/vnd.ms-excel',
        'application/vnd.ms-excel.sheet.macroEnabled.12'
    ]

    var magic = new Magic(mmm.MAGIC_MIME_TYPE),
        buf = Buffer.from(fileData, 'base64');

    return new Promise((resolve, reject) => {
        magic.detect(buf, function (err, result) {

            if (err) reject(err);

            if (fileSize > 1048576) {
                reject(new Error("file size limit exceeded!!!"));
            }
            if (!validMimeTypes.includes(mimeType)) {
                reject(new Error("Invalid file type!!!"));
            }

            const regEx = /^[\w-]+\.(pdf|xls|xlsx|xlsb|xlsm)$/gi
            const pattern = regEx.test(fileName);
            if (!pattern) {
                reject(new Error("Invalid file format!!!"));
            }

            if (mimeType == result) {
                resolve(true)
            } else {
                reject(new Error("Invalid file type!!!"))
            }
        })
    })
}

module.exports = fileService;
