const Axios = require('axios').default
var mmm = require('mmmagic')
Magic = mmm.Magic;

const AWS = require('aws-sdk');


const { fileModel } = require('../model/models')

const fileService = {};

fileService.insertFile = (file) => {
    return fileModel.findOne({ fileHash: file.fileHash })
        .then(data => {
            if (data) {
                let getUploadFileResponse = {
                    fileHash: data.fileHash
                }
                return getUploadFileResponse
            }
            else {
                // return fileModel.create({ fileName: file.fileName, fileData: file.fileData, fileHash: file.fileHash, fileSize: file.fileSize })
                //     .then(data => {
                //         let InsertFileResponse = {
                //             fileName: data.fileName,
                //             fileHash: data.fileHash,
                //             fileSize: data.fileSize
                //         }
                //         return InsertFileResponse
                //     })
                //     .catch(err => {
                //         err = new Error("Not able to save the file in DB")
                //         err.status = 400
                //         throw err
                //     })

                const createItemObject = (callback) => {
                    var base64data = new Buffer(data, 'binary');
                    const params = {
                        Bucket: bucketName,
                        Key: `${fileName}`,
                        ACL: 'public-read',
                        Metadata: { id: '0b5e4838-a6a0-4784-98d8-c58a76201957', name: '69a62347-8641-45ba-9924.txt' },
                        Body: base64data,
                    };
                    s3.putObject(params, function (err, data) {
                        if (err) {
                            console.log("Error uploading file", err);
                            callback(err, null)
                        } else {
                            console.log("Successfully uploaded fileon S3", data);
                            callback(null, data)
                        }
                    })
                }
                exports.upload = (req, res, next) => {
                    var tmp_path = req.files.file.path;
                    // console.log("item", req.files.file)
                    var tmp_path = req.files.file.path;
                    image = fs.createReadStream(tmp_path);
                    imageName = req.files.file.name;
                    async.series([
                        createMainBucket,
                        createItemObject
                    ], (err, result) => {
                        if (err) return res.send(err)
                        else return res.json({ message: "Successfully uploaded" })
                    })
                }

            }
        })
        .catch(err => {
            return err
        })
}

fileService.getFiles = (fileHash) => {
    return fileModel.findOne({ fileHash: fileHash })
        .then(data => {
            if (data) {
                let getFileResponse = {
                    fileName: data.fileName,
                    fileData: data.fileData
                }
                return getFileResponse
            }
            else {
                let err = new Error("File does not exist")
                err.status = 400
                delete err.stack;
                return Promise.reject(err)
            }
        })
        .catch(err => {
            return Promise.reject(err)
        })
}

fileService.virusScan = (req, res, next) => {
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

            console.log('file mime: ' + result);
            if (mimeType == result) {
                resolve(true)
            } else {
                reject(new Error("Invalid file type!!!"))
            }
        })
    })
}

module.exports = fileService;
