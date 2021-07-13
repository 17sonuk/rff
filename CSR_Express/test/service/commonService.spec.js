const chai = require('chai');
const { expect } = require('chai');
var sandbox = require("sinon").createSandbox();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const commonService = require('../../service/commonService');
const commonModel = require('../../model/commonModel');


describe('TESTING COMMON SERVICE - SAVE COMMUNITIES', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'saveCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for saveCommunities', async () => {
        const communities = [{
            name: "TestUser12",
            place: "Test12"
        }]
        mockObj.resolves(communities);
        let res = await commonService.saveCommunities(communities)
        expect(res).to.equal(communities)

        //If communities is not getting saved
        mockObj.resolves(null);
        try{
            let res = await commonService.saveCommunities(communities)
            expect(res).to.equal(communities)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET COMMUNITIES', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getCommunities', async () => {
        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        mockObj.resolves(communities);
        let res = await commonService.getCommunities()
        expect(res).to.equal(communities)

        //If communities is not found
        mockObj.resolves(null);
        try{
            let res = await commonService.getCommunities()
            expect(res).to.equal(communities)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - SAVE DONOR', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'saveDonor');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for saveDonor', async () => {
        const donor={
            
                        name: "Ngo1"
                    }
        mockObj.resolves(donor);
        let res = await commonService.saveDonor(donor)
        expect(res).to.equal(donor)

        //If not able to save donor
        mockObj.resolves(null);
        try{
            let res = await commonService.saveDonor(donor)
            expect(res).to.equal(donor)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET DONOR', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getDonors');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getDonors', async () => {
        const donor={
            
                        name: "Ngo1"
                    }
        mockObj.resolves(donor);
        let res = await commonService.getDonors()
        expect(res).to.equal(donor)

        //If not able to find donors
        mockObj.resolves(null);
        try{
            let res = await commonService.getDonors()
        expect(res).to.equal(donor)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})















