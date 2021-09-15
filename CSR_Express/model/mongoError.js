module.exports = (error) => {

    let response = {
        success: false,
        message: ''
    }
    let msg = ''

    if (error.message.includes('connect ECONNREFUSED')) {
        msg = 'Database connection issue! Please report';
    }
    else if (error.errors) {
        msg = error.errors[Object.keys(error.errors)[0]].message
    }
    else {
        msg = error.message || error._message || 'Some error occurred'
    }
    
    response.message = msg
    return response

}