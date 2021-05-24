const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)

const userService = require('../../model/userService');
const userModel = require('../../model/userModel');

const testUser = {
    name: 'ngo1',
    description: '',
    pan: 'PAN123',
    email: 'info@ngo1.com',
    regId: 'reg001',
    address: {
        doorNo: '',
        flat: '',
        street: '',
        country: '',
        state: '',
        district: '',
        locality: '',
        pinCode: ''
    },
    contact: [
        {
            name: 'ngo1-office',
            number: '9898989898'
        }
    ],
    userName: 'ngo1',
    role: 'Ngo',
    status: 'created'
}

