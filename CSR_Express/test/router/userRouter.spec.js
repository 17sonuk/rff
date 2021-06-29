const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const app = require('../../routers/mongo/userRoute')
chai.use(chaiAsPromised)

describe('USER ROUTER - Testing app get routing', () => {
   

})

describe('USER ROUTER - Testing app post routing', () => {
    // it('Testing onboard API', async() => {
    //     const res = await request(app).post('/onboard')
    //     console.log("Response",res);
    // })
    
})