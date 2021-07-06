package main

import (
	main "csrcc/go"
	"os"
	"testing"

	// "chaincode/go/pkg/mod/github.com/stretchr/testify@v1.7.0/require"
	mocks "csrcc/go/mocks"
	// "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	// "github.com/hyperledger/fabric-chaincode-go/shim"
	// "github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"
	"github.com/stretchr/testify/require"
	// "github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
	// "chaincode/go/pkg/mod/github.com/hyperledger/fabric-chaincode-go@v0.0.0-20210603161043-af0e3898842a/pkg/cid"
)

const ngoMsp4 = "NgoMSP"
const ngoClient4 = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const corpClientid4 = "CorporateMSP"
const tmpCorpClient4 = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const ca4 = "CreditsAuthorityMSP"
const caClient4 = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo4() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks4(ngoMsp4, ngoClient4)
}
func prepMocksAsCorp4() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks4(corpClientid4, tmpCorpClient4)
}
func prepMocksAsCa4() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks4(ca4, caClient4)
}

func prepMocks4(orgMSP, clientId string) (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	clientIdentity := &mocks.ClientIdentity{}
	clientIdentity.GetMSPIDReturns(orgMSP, nil)
	clientIdentity.GetIDReturns(clientId, nil)
	//set matching msp ID using peer shim env variable
	os.Setenv("CORE_PEER_LOCALMSPID", orgMSP)
	transactionContext.GetClientIdentityReturns(clientIdentity)
	return transactionContext, chaincodeStub
}

type stateQueryIterator interface {
	shim.StateQueryIteratorInterface
}

func TestCommonQuery(test *testing.T) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	squery := "{\"selector\":{\"docType\":\"Project\"}}, projectName: 'project1'"

	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)
	chaincodeStub.GetQueryResultReturns(iterator, nil)
	_, err := csr.CommonQuery(transactionContext, squery)
	require.NoError(test, err)

}
