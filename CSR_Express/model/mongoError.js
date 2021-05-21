module.exports = (error) => {

    let response = {
        success: false,
        message: ''
    }

    let msg = error.message || error._message || 'Some error occurred'

    if (msg.includes('validation failed')) {
        response.message = 'Invalid fields'
    } else if (msg.includes('buffering timed out')) {
        response.message = 'Connection issue'
    } else {
        response.message = msg
    }

    return response

}