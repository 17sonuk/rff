package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	"github.com/stretchr/testify/require"
	// "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	// "github.com/hyperledger/fabric-chaincode-go/shim"
	// "github.com/hyperledger/fabric-contract-api-go/contractapi"
	// "github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
)

const ngoMsp2 = "NgoMSP"
const ngoClient2 = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

// const tmpCorpClient = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
// const corpClientid = "CorporateMSP"

const ca2 = "CreditsAuthorityMSP"
const caClient2 = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo2() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks2(ngoMsp2, ngoClient2)
}

// func prepMocksAsCorp() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
// 	return prepMocks(corpClientid, tmpCorpClient)
// }
func prepMocksAsCa2() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks2(ca2, caClient2)
}

func prepMocks2(orgMSP, clientId string) (*mocks.TransactionContext, *mocks.ChaincodeStub) {
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

func TestRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	pd := main.PaymentDetails{
		PaymentType:   "Paypal",
		PaypalEmailId: "ngo@info.com",
	}

	redeem := main.Redeem{
		Qty:            1000,
		PaymentId:      "200034567",
		PaymentDetails: pd,
	}
	RedAsBytes, _ := json.Marshal(redeem)
	red := string(RedAsBytes)

	redeemId := "867890987654321"
	dat := "19"
	txid := "49022892345678"
	var uparg [4]string
	uparg[0] = redeemId
	uparg[1] = red
	uparg[2] = dat
	uparg[3] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	balance := "50000"

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	_, err := csr.RedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, err, "error getting the balance of the ngo", ex1)

}

func TestApproveRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	pd := main.PaymentDetails{
		PaymentType:   "Paypal",
		PaypalEmailId: "ngo@info.com",
	}

	redeemob := main.Redeem{
		Qty:            1000,
		PaymentId:      "2000",
		PaymentDetails: pd,
		ObjectType:     "Redeem",
		From:           "goonj.ngo.csr.com",
		Status:         "Requested",
		Date:           15,
	}
	RedAsBytes1, _ := json.Marshal(redeemob)

	redeamId := "10001"
	PaymentId := "1001"
	date := "15"
	txid := "t00045432"
	var uparg [4]string
	uparg[0] = redeamId
	uparg[1] = PaymentId
	uparg[2] = date
	uparg[3] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes1, nil)
	_, err := csr.ApproveRedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 is not present", ex1)

}

func TestRejectRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	pd := main.PaymentDetails{
		PaymentType:   "Paypal",
		PaypalEmailId: "ngo@info.com",
	}

	redeemob := main.Redeem{
		Qty:            1000,
		PaymentId:      "2000",
		PaymentDetails: pd,
		ObjectType:     "Redeem",
		From:           "goonj.ngo.csr.com",
		Status:         "Requested",
		Date:           15,
	}
	RedAsBytes1, _ := json.Marshal(redeemob)

	redeamId := "10001"
	Comments := "Rejected"
	date := "15"
	txid := "t0007864"
	var uparg [4]string
	uparg[0] = redeamId
	uparg[1] = Comments
	uparg[2] = date
	uparg[3] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	balance := "50000"
	balbytes, _ := json.Marshal(balance)

	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, balbytes, nil)
	_, err := csr.RejectRedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.RejectRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 not found", ex1)

}
