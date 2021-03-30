const bcrypt = require("bcrypt");
const userModel = require('../model/userModel');

const userService = {};

console.log('<<<<<<<<<<<<<< user service >>>>>>>>>>>>>>>>>')

//Onboarding of user
userService.registerUser = (obj) => {
    if (obj['role'] === 'CA_Verifier' || obj['role'] === 'CA_Approver') {
        obj['status'] = 'approved';
    } else {
        obj['status'] = 'created';
    }

    obj['date'] = new Date().getTime();
    return userModel.registerUser(obj).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get user details
userService.getUserDetails = (userName) => {
    return userModel.getUserDetails(userName).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get user details
userService.getUnapprovedUserDetails = () => {
    return userModel.getUnapprovedUserDetails().then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//approve user
userService.approveUser = (userName, pan) => {
    return userModel.approveUser(userName, pan).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//login user
userService.login = (userName, password) => {
    return userModel.getUserDetails(userName).then(data => {
        console.log(data);
        if (data) {
            //check password
            if (password == null || password == undefined || password.length == 0) {
                return { success: false, message: 'wrong credentials!' };
            }

            const result = bcrypt.compareSync(password, data['password']);

            if (result == false) {
                return { success: false, message: 'wrong credentials!' };
            } else if (data['status'] == 'approved') {
                return { success: true, message: 'login successful', userName: data.userName, role: data.role, name: data.name };
            } else {
                return { success: false, message: 'onboarding not approved' }
            }
        } else {
            return { success: false, message: 'user does not exist' }
        }
    });
}

// amount of corporate to convert in credits
userService.getAmountFromBalanceSheet = (userName) => {
    return userModel.getAmountFromBalanceSheet(userName).then(data => {
        if (data) {
            let d = new Date();
            let y = d.getFullYear();
            let m = d.getMonth();
            let year_p1 = '';
            let year_p2 = '';
            let year_p3 = '';
            if (m < 3) {
                year_p1 = String(y - 2) + '-' + String(y - 1);
                year_p2 = String(y - 3) + '-' + String(y - 2);
                year_p3 = String(y - 4) + '-' + String(y - 3);
            } else {
                year_p1 = String(y - 1) + '-' + String(y);
                year_p2 = String(y - 2) + '-' + String(y - 1);
                year_p3 = String(y - 3) + '-' + String(y - 2);
            }
            let total = 0;
            let j = 0;
            for (let i = 0; i < data.file.length; i++) {
                if (data.file[i].year == year_p1 || data.file[i].year == year_p2 || data.file[i].year == year_p3) { total += Number(data.file[i].amount); j++; }
            }
            if (j == 3) return { success: true, amount: Math.ceil(total / 300) * 2 };
            else return { success: false, message: 'balance sheets are not avilable.' }

        } else return { success: false, message: 'not getting files from db' }
    })
}

//get notifications
userService.getNotifications = (username, seen) => {
    return userModel.getNotifications(username, seen).then(async notification => {
        if (notification) {
            for (let i = 0; i < notification.length; i++) {
                await userModel.getNotificationDescription(notification[i].txId).then(data => {
                    if (data) {
                        notification[i]['description'] = data.description
                    }
                })
            }
            return notification
        }
        else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

// update notification
userService.updateNotification = (username, txId) => {
    return userModel.updateNotification(username, txId).then(status => {
        if (status['nModified'] > 0) {
            return { success: true, message: 'notification updated' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

module.exports = userService;