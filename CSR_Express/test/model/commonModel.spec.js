const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')
const commonModel = require('../../model/commonModel');

describe('TESTING COMMON MODEL', () => {
    before((done) => {
        connectionToMongo('_test');
        done();
    })

    after((done) => {
        disconnectMongo()
            .then(() => {
                console.log('Mongo connection closed.');
                done()
            })
            .catch((err) => done(err))
    })

    it('testing response for uploadBalanceSheet', async () => {
        const file='x.pdf'
        const res = await commonModel.uploadBalanceSheet('ngo91',file);
        expect(res).to.be.a('object');
    });

    it('testing response for saveCommunities', async () => {
        const communities=[{
            name:"TestUser",
            place:"Test"
        }]
        const res = await commonModel.saveCommunities(communities);
        expect(res).to.have.lengthOf(1);
        expect(res[0].name).to.equal('TestUser')
        expect(res[0].place).to.equal('Test')
    });
    
    it('testing response for getCommunities', async () => {
        const res = await commonModel.getCommunities();
        expect(res).to.have.lengthOf(1);
        expect(res[0].name).to.equal('TestUser')
        expect(res[0].place).to.equal('Test')
    });
    
    it('testing response for saveDonor', async () => {
        const donor={
            email:"ngo@ngo.com",
            name: "Ngo"
        }
        const res = await commonModel.saveDonor(donor);
        expect(res).to.be.a('object');
        expect(res.email).to.equal('ngo@ngo.com')
        expect(res.name).to.equal('Ngo')
    });

    it('testing response for saveDonor if email already exist', async () => {
        const donor={
            email:"ngo@ngo.com",
            name: "Ngo"
        }
        const res = await commonModel.saveDonor(donor);
        expect(res).to.equal('Donor already exists!')
        
    });

    it('testing response for saveDonor if email field is blank', async () => {
        const donor={
            email:"",
            name: "Ngo3"
        }
        try{
        const res = await commonModel.saveDonor(donor);
        expect(res).to.equal('Donor already exists!')
        }catch(err){
            expect(err._message).to.equal('Donor validation failed')
        }
        
    });
    
    it('testing response for getDonors', async () => {
        const res = await commonModel.getDonors();
        expect(res[0].email).to.equal('ngo@ngo.com')
        expect(res[0].name).to.equal('Ngo')
    });
})