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
                return fileModel.create({ fileName: file.fileName, fileData: file.fileData, fileHash: file.fileHash, fileSize: file.fileSize })
                    .then(data => {
                        let InsertFileResponse = {
                            fileName: data.fileName,
                            fileHash: data.fileHash,
                            fileSize: data.fileSize
                        }
                        return InsertFileResponse
                    })
                    .catch(err => {
                        err = new Error("Not able to save the file in DB")
                        err.status = 400
                        throw err
                    })
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
module.exports = fileService;
