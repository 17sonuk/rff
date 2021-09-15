package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"
	"github.com/hyperledger/fabric-protos-go/peer"
	"github.com/stretchr/testify/require"
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

func TestQueryByKey(test *testing.T) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	var arg [1]string
	key := "12345678"
	arg[0] = key
	byt, _ := json.Marshal(arg)
	s := string(byt)

	var arg1 [3]string
	byt1, _ := json.Marshal(arg1)
	s1 := string(byt1)

	chaincodeStub.GetStateReturns(byt, nil)
	_, er := csr.QueryByKey(transactionContext, s)
	require.NoError(test, er)

	chaincodeStub.GetStateReturns(byt1, nil)
	_, er = csr.QueryByKey(transactionContext, s1)
	require.EqualError(test, er, "Incorrect number of arguments. Expecting 1")

	chaincodeStub.GetStateReturns(nil, nil)
	_, er = csr.QueryByKey(transactionContext, s)
	require.EqualError(test, er, "No data exists for the key: 12345678")

}

func TestGetBalance(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCorp4()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	balance := "23456"
	snapbal := "1000"

	chaincodeStub.GetStateReturnsOnCall(0, []byte(balance), nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(snapbal), nil)
	_, er := csr.GetBalance(transactionContext)
	require.NoError(test, er)

}

func TestGetAllCorporates(test *testing.T) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	var arg [2]string
	arg[0] = "keanu"
	arg[1] = "infosys"
	jsonarg, _ := json.Marshal(arg)

	chaincodeStub.GetStateReturns(jsonarg, nil)
	_, er := csr.GetAllCorporates(transactionContext)
	require.NoError(test, er)

}

func TestCommonQueryPagination(test *testing.T) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	squery := "{\"selector\":{\"docType\":\"Project\"}}, projectName: 'project1'"
	PageSize := "10"
	Bookmark := "sfdrr4wereaf"
	var arg [3]string
	arg[0] = squery
	arg[1] = PageSize
	arg[2] = Bookmark
	jsonarg, _ := json.Marshal(arg)
	s := string(jsonarg)

	var arg1 [1]string
	jsonarg1, _ := json.Marshal(arg1)
	s1 := string(jsonarg1)

	var arg2 [3]string
	arg[0] = squery
	arg[1] = "0"
	jsonarg2, _ := json.Marshal(arg2)
	s2 := string(jsonarg2)

	pes := &peer.QueryResponseMetadata{}
	pes.FetchedRecordsCount = 1
	pes.Bookmark = Bookmark

	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)

	chaincodeStub.GetQueryResultWithPaginationReturns(iterator, pes, nil)
	_, err := csr.CommonQueryPagination(transactionContext, s)
	require.NoError(test, err)

	pes = &peer.QueryResponseMetadata{}
	iterator = &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)
	chaincodeStub.GetQueryResultWithPaginationReturns(iterator, pes, nil)
	_, err = csr.CommonQueryPagination(transactionContext, s1)
	require.EqualError(test, err, "Incorrect number of arguments. Expecting 3")

	pes = &peer.QueryResponseMetadata{}
	iterator = &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)
	chaincodeStub.GetQueryResultWithPaginationReturns(iterator, pes, nil)
	_, err = csr.CommonQueryPagination(transactionContext, s2)
	require.EqualError(test, err, "Invalid page size!")

}
