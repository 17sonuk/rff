const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const commonService = require('../../service/commonService');
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');

let Country = require('country-state-city').Country;
let State = require('country-state-city').State;
let City = require('country-state-city').City;

describe('COUNTRY ROUTER - /countries API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(Country, 'getAllCountries');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing countries api', async function () {

        const countries = []
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        // /country/countries",
        // "/country/states",
        // "/country/cities"
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(countries)
        const response = await request(app)
            .get("/country/countries").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
            });
        expect(response.status).to.equal(200);

        // //If countries fields are empty
        // mockObj.rejects('Bad Connection')
        // const response1 = await request(app)
        //     .get("/country/countries").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        //     .send({

        //     });
        // expect(response1.status).to.equal(500);
    })
})

describe('COUNTRY ROUTER - /states API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(State, 'getStatesOfCountry');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing states api', async function () {

        const states = []
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        // /country/countries",
        // "/country/states",
        // "/country/cities"
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(states)
        const response = await request(app)
            .get("/country/states").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
            });
        expect(response.status).to.equal(200);

        // //If states fields are empty
        // mockObj.rejects('Bad Connection')
        // const response1 = await request(app)
        //     .get("/country/countries").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        //     .send({

        //     });
        // expect(response1.status).to.equal(500);
    })
})

describe('COUNTRY ROUTER - /cities API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(City, 'getCitiesOfState');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing states api', async function () {

        const states = []
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
    
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(states)
        const response = await request(app)
            .get("/country/cities").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
            });
        expect(response.status).to.equal(200);

        // //If states fields are empty
        // mockObj.rejects('Bad Connection')
        // const response1 = await request(app)
        //     .get("/country/cities").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        //     .send({

        //     });
        // expect(response1.status).to.equal(500);
    })
})