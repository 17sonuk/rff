package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"
	"github.com/stretchr/testify/require"
)

const ngoMsp2 = "NgoMSP"
const ngoClient2 = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const tmpCorpClient2 = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
const corpClientid2 = "CorporateMSP"

const ca2 = "CreditsAuthorityMSP"
const caClient2 = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo2() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks2(ngoMsp2, ngoClient2)
}

func prepMocksAsCorp2() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks2(corpClientid2, tmpCorpClient2)
}
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

	// paypal
	pd1 := main.PaymentDetails{
		PaymentType:   "Paypal",
		PaypalEmailId: "",
	}

	redeem1 := main.Redeem{
		Qty:            1000,
		PaymentId:      "200034567",
		PaymentDetails: pd1,
	}
	RedAsBytes1, _ := json.Marshal(redeem1)
	red1 := string(RedAsBytes1)

	var uparg0 [4]string
	uparg0[0] = redeemId
	uparg0[1] = red1
	uparg0[2] = dat
	uparg0[3] = txid
	jsonuparg0, _ := json.Marshal(uparg0)
	s0 := string(jsonuparg0)

	// crypto

	pd2 := main.PaymentDetails{
		PaymentType:   "Cryptocurrency",
		PaypalEmailId: "",
	}

	redeem2 := main.Redeem{
		Qty:            1000,
		PaymentId:      "200034567",
		PaymentDetails: pd2,
	}
	RedAsBytes2, _ := json.Marshal(redeem2)
	red2 := string(RedAsBytes2)

	var uparg01 [4]string
	uparg01[0] = redeemId
	uparg01[1] = red2
	uparg01[2] = dat
	uparg01[3] = txid
	jsonuparg01, _ := json.Marshal(uparg01)
	s01 := string(jsonuparg01)

	// bank

	pd3 := main.PaymentDetails{
		PaymentType:   "Bank",
		PaypalEmailId: "",
	}

	redeem3 := main.Redeem{
		Qty:            1000,
		PaymentId:      "200034567",
		PaymentDetails: pd3,
	}
	RedAsBytes3, _ := json.Marshal(redeem3)
	red3 := string(RedAsBytes3)

	var uparg02 [4]string
	uparg02[0] = redeemId
	uparg02[1] = red3
	uparg02[2] = dat
	uparg02[3] = txid
	jsonuparg02, _ := json.Marshal(uparg02)
	s02 := string(jsonuparg02)

	var uparg1 [2]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [4]string
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [4]string
	uparg3[0] = redeemId
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [4]string
	uparg4[0] = redeemId
	uparg4[1] = red
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [4]string
	uparg5[0] = redeemId
	uparg5[1] = red
	uparg5[2] = dat
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	_, err := csr.RedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, err, "error getting the balance of the ngo", ex1)

	ex1, err = csr.RedeemRequest(transactionContext, s1)
	require.EqualError(test, err, "Incorrect no. of arguments. Expecting 4", ex1)

	ex1, err = csr.RedeemRequest(transactionContext, s2)
	require.EqualError(test, err, "redeem id must be a non-empty string", ex1)

	ex1, err = csr.RedeemRequest(transactionContext, s3)
	require.EqualError(test, err, "redeem request details must be a non-empty string", ex1)

	ex1, err = csr.RedeemRequest(transactionContext, s4)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	ex1, err = csr.RedeemRequest(transactionContext, s5)
	require.EqualError(test, err, "tx id must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	ex1, err = csr.RedeemRequest(transactionContext, s0)
	require.EqualError(test, err, "paypal email id of beneficiary is missing", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	ex1, err = csr.RedeemRequest(transactionContext, s01)
	require.EqualError(test, err, "crypto address of beneficiary is missing", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	ex1, err = csr.RedeemRequest(transactionContext, s02)
	require.EqualError(test, err, "bank account details of beneficiary is missing", ex1)

	transactionContext, chaincodeStub = prepMocksAsCorp2()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, err, "only ngo can initiate redeem request", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, []byte(redeemId), nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	_, errr := csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, errr, "This redeem id is already used")

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("1"), nil)
	_, errr = csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, errr, "redeem amount cannot be more than the balance")

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

	redeemob2 := main.Redeem{
		Qty:            1000,
		PaymentId:      "2000",
		PaymentDetails: pd,
		ObjectType:     "Redeem",
		From:           "goonj.ngo.csr.com",
		Status:         "Approved",
		Date:           15,
	}
	RedAsBytes2, _ := json.Marshal(redeemob2)

	redeemob3 := main.Redeem{
		Qty:            1000,
		PaymentId:      "2000",
		PaymentDetails: pd,
		ObjectType:     "Redeem",
		From:           "goonj.ngo.csr.com",
		Status:         "gfdh",
		Date:           15,
	}
	RedAsBytes3, _ := json.Marshal(redeemob3)

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

	var uparg1 [2]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [4]string
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [4]string
	uparg3[0] = redeamId
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [4]string
	uparg4[0] = redeamId
	uparg4[1] = PaymentId
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [4]string
	uparg5[0] = redeamId
	uparg5[1] = PaymentId
	uparg5[2] = date
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes1, nil)
	_, err := csr.ApproveRedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 is not present", ex1)

	ex1, err = csr.ApproveRedeemRequest(transactionContext, s1)
	require.EqualError(test, err, "Incorrect no. of arguments. Expecting 4", ex1)

	ex1, err = csr.ApproveRedeemRequest(transactionContext, s2)
	require.EqualError(test, err, "redeem id must be a non-empty string", ex1)

	ex1, err = csr.ApproveRedeemRequest(transactionContext, s3)
	require.EqualError(test, err, "payment id must be a non-empty string", ex1)

	ex1, err = csr.ApproveRedeemRequest(transactionContext, s4)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	ex1, err = csr.ApproveRedeemRequest(transactionContext, s5)
	require.EqualError(test, err, "tx id must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)
	squery := "{\"selector\":{\"docType\":\"Project\"}}, projectName: 'project1'"
	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, true)
	iterator.HasNextReturnsOnCall(2, true)
	iterator.HasNextReturnsOnCall(3, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)
	chaincodeStub.GetQueryResultReturns(iterator, nil)
	ex1, err = csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "Transaction id: "+PaymentId+" is already used", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes2, nil)
	ex1, err = csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "this redeem request is already approved", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes3, nil)
	ex1, err = csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "Invalid redeem status", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "only creditsauthority can approve redeem request", ex1)

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

	var uparg1 [3]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [4]string
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [4]string
	uparg3[0] = redeamId
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [4]string
	uparg4[0] = redeamId
	uparg4[1] = Comments
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [4]string
	uparg5[0] = redeamId
	uparg5[1] = Comments
	uparg5[2] = date
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	balance := "50000"
	balbytes := []byte(balance)

	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, balbytes, nil)
	_, err := csr.RejectRedeemRequest(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.RejectRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 not found", ex1)

	ex1, err = csr.RejectRedeemRequest(transactionContext, s1)
	require.EqualError(test, err, "Incorrect no. of arguments. Expecting 4", ex1)

	ex1, err = csr.RejectRedeemRequest(transactionContext, s2)
	require.EqualError(test, err, "redeem id must be a non-empty string", ex1)

	ex1, err = csr.RejectRedeemRequest(transactionContext, s3)
	require.EqualError(test, err, "rejection comments must be a non-empty string", ex1)

	ex1, err = csr.RejectRedeemRequest(transactionContext, s4)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	ex1, err = csr.RejectRedeemRequest(transactionContext, s5)
	require.EqualError(test, err, "tx id must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo2()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.RejectRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "only creditsauthority can verify/approve redeem request", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa2()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, RedAsBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, err = csr.RejectRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "error getting the balance of the ngo")
}
