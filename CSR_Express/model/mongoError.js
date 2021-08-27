module.exports = (error) => {

    let response = {
        success: false,
        message: ''
    }
    // console.log(Object.keys(error.errors));
    // console.log(error._message);
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


    // if (msg.includes('validation failed')) {
    //     response.message = 'Invalid fields'
    // } else if (msg.includes('buffering timed out')) {
    //     response.message = 'Connection issue'
    // } else {
    //     response.message = msg
    // }
    response.message = msg
    return response

}