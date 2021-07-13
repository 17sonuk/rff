package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	// "chaincode/go/pkg/mod/github.com/stretchr/testify@v1.7.0/require"

	// "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	// "github.com/hyperledger/fabric-chaincode-go/shim"
	// "github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/require"
	// "github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
	// "chaincode/go/pkg/mod/github.com/hyperledger/fabric-chaincode-go@v0.0.0-20210603161043-af0e3898842a/pkg/cid"
)

const ca3 = "CreditsAuthorityMSP"
const caClient3 = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const tmpCorpClient = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
const corpClientid = "CorporateMSP"

func prepMocksAsCorp() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks1(corpClientid, tmpCorpClient)
}
func prepMocksAsCa3() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks1(ca3, caClient3)
}

func prepMocks1(orgMSP, clientId string) (*mocks.TransactionContext, *mocks.ChaincodeStub) {
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

func TestRequestTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	Qty := "1000"
	PaymentId := "1001"
	Status := "COMPLETED"
	Comments := "Requested"
	date := "15"
	txid := "t000368"
	var uparg [6]string
	uparg[0] = Qty
	uparg[1] = PaymentId
	uparg[2] = Status
	uparg[3] = Comments
	uparg[4] = date
	uparg[5] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	var uparg1 [5]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [6]string
	uparg2[0] = ""
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [6]string
	uparg3[0] = Qty
	uparg3[1] = ""
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [6]string
	uparg4[0] = Qty
	uparg4[1] = PaymentId
	uparg4[2] = ""
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [6]string
	uparg5[0] = Qty
	uparg5[1] = PaymentId
	uparg5[2] = Status
	uparg5[4] = ""
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	var uparg6 [6]string
	uparg6[0] = Qty
	uparg6[1] = PaymentId
	uparg6[2] = Status
	uparg6[3] = Comments
	uparg6[4] = date
	uparg6[5] = ""
	jsonuparg6, _ := json.Marshal(uparg6)
	s6 := string(jsonuparg6)

	var uparg7 [6]string
	uparg7[0] = "0.0"
	uparg7[1] = PaymentId
	uparg7[2] = Status
	uparg7[3] = Comments
	uparg7[4] = date
	uparg7[5] = txid
	jsonuparg7, _ := json.Marshal(uparg7)
	s7 := string(jsonuparg7)

	var uparg8 [6]string
	uparg8[0] = Qty
	uparg8[1] = PaymentId
	uparg8[2] = "PENDING"
	uparg8[3] = Comments
	uparg8[4] = date
	uparg8[5] = txid
	jsonuparg8, _ := json.Marshal(uparg8)
	s8 := string(jsonuparg8)

	var uparg9 [6]string
	uparg9[0] = Qty
	uparg9[1] = PaymentId
	uparg9[2] = "PENDING"
	uparg9[3] = Comments
	uparg9[4] = "date"
	uparg9[5] = txid
	jsonuparg9, _ := json.Marshal(uparg9)
	s9 := string(jsonuparg9)

	_, err := csr.RequestTokens(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.RequestTokens(transactionContext, s1)
	require.EqualError(test, err, "Incorrect no. of arguments. Expecting 6", ex1)

	ex1, err = csr.RequestTokens(transactionContext, s2)
	require.EqualError(test, err, "Qty must be a non-empty string", ex1)

	ex1, err = csr.RequestTokens(transactionContext, s3)
	require.EqualError(test, err, "payment id must be a non-empty string", ex1)

	ex1, err = csr.RequestTokens(transactionContext, s4)
	require.EqualError(test, err, "payment status must be a non-empty string", ex1)

	ex1, err = csr.RequestTokens(transactionContext, s5)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	ex, errors := csr.RequestTokens(transactionContext, s6)
	require.EqualError(test, errors, "txid must be a non-empty string", ex)

	ex, errors = csr.RequestTokens(transactionContext, s7)
	require.EqualError(test, errors, "Invalid amount!", ex)

	ex, errors = csr.RequestTokens(transactionContext, s8)
	require.NoError(test, errors)

	ex, errors = csr.RequestTokens(transactionContext, s9)
	require.EqualError(test, errors, "Error converting date strconv.Atoi: parsing \"date\": invalid syntax", ex)

	chaincodeStub.GetStateReturns([]byte(PaymentId), nil)
	ex1, err = csr.RequestTokens(transactionContext, s)
	require.EqualError(test, err, "Fund request with this ID already exists", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	ex1, err = csr.RequestTokens(transactionContext, s)
	require.EqualError(test, err, "only corporate can initiate requestTokens", ex1)

	// transactionContext, chaincodeStub = prepMocksAsCorp()
	// transactionContext.GetStubReturns(chaincodeStub)

	// chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	// chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	// chaincodeStub.GetStateReturnsOnCall(2, []byte(txid), nil)
	// ex1, errr := csr.RequestTokens(transactionContext, s)
	// require.EqualError(test, errr, "Failed to add a Tx: ", ex1)
}

func TestTransferTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	Amount := "1000"
	ProjectId := "10001"
	phaseNumber := "0"
	Notes := "Requested"
	date := "15"
	txid := "t000467"
	var uparg [6]string
	uparg[0] = Amount
	uparg[1] = ProjectId
	uparg[2] = phaseNumber
	uparg[3] = Notes
	uparg[4] = date
	uparg[5] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	var uparg1 [5]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [6]string
	uparg2[0] = ""
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [6]string
	uparg3[0] = Amount
	uparg3[1] = ""
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [6]string
	uparg4[0] = Amount
	uparg4[1] = ProjectId
	uparg4[2] = ""
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [6]string
	uparg5[0] = Amount
	uparg5[1] = ProjectId
	uparg5[2] = phaseNumber
	uparg5[4] = ""
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	var uparg6 [6]string
	uparg6[0] = Amount
	uparg6[1] = ProjectId
	uparg6[2] = phaseNumber
	uparg6[3] = Notes
	uparg6[4] = date
	uparg6[5] = ""
	jsonuparg6, _ := json.Marshal(uparg6)
	s6 := string(jsonuparg6)

	var uparg7 [6]string
	uparg7[0] = "0.0"
	uparg7[1] = ProjectId
	uparg7[2] = phaseNumber
	uparg7[3] = Notes
	uparg7[4] = date
	uparg7[5] = txid
	jsonuparg7, _ := json.Marshal(uparg7)
	s7 := string(jsonuparg7)

	var uparg8 [6]string
	uparg8[0] = Amount
	uparg8[1] = ProjectId
	uparg8[2] = "-1"
	uparg8[3] = Notes
	uparg8[4] = date
	uparg8[5] = txid
	jsonuparg8, _ := json.Marshal(uparg8)
	s8 := string(jsonuparg8)

	var uparg9 [6]string
	uparg9[0] = Amount
	uparg9[1] = ProjectId
	uparg9[2] = phaseNumber
	uparg9[3] = Notes
	uparg9[4] = "fsdkkd"
	uparg9[5] = txid
	jsonuparg9, _ := json.Marshal(uparg9)
	s9 := string(jsonuparg9)

	contrib := main.Contribution{
		Contributor:     "keanu.corporate.csr.com",
		ContributionQty: 100.0,
	}
	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     5000,
			PhaseState:         "Open For Funding",
			StartDate:          10,
			EndDate:            20,
			Contributions:      map[string]main.Contribution{"keanu.corporate.csr.com": contrib},
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		Contributors:     map[string]string{"c1": "exists"},
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}

	newProAsBytes, _ := json.Marshal(projObj)
	balance := "5000000000"

	lowBalance := "1"

	ph1 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     5000,
			PhaseState:         "Created",
			StartDate:          10,
			EndDate:            20,
			Contributions:      map[string]main.Contribution{"keanu.corporate.csr.com": contrib},
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}

	projObj1 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph1,
		CreationDate:     10,
		TotalProjectCost: 5000,
		Contributors:     map[string]string{"c1": "exists"},
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}

	newProAsBytes1, _ := json.Marshal(projObj1)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(balance), nil)
	_, err := csr.TransferTokens(transactionContext, s)
	require.NoError(test, err, "err")

	ex1, err := csr.TransferTokens(transactionContext, s)
	require.EqualError(test, err, "No such project exists!", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s1)
	require.EqualError(test, err, "Incorrect number of arguments. Expecting 6", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s2)
	require.EqualError(test, err, "amount must be a non-empty string", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s3)
	require.EqualError(test, err, "project id must be a non-empty string", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s4)
	require.EqualError(test, err, "phase number must be a non-empty string", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s5)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	ex1, err = csr.TransferTokens(transactionContext, s6)
	require.EqualError(test, err, "tx id must be a non-empty string", ex1)

	ex, errors := csr.TransferTokens(transactionContext, s7)
	require.EqualError(test, errors, "Invalid Amount!", ex)

	ex, errors = csr.TransferTokens(transactionContext, s8)
	require.EqualError(test, errors, "Invalid phase Number!", ex)

	ex, errors = csr.TransferTokens(transactionContext, s9)
	require.EqualError(test, errors, "date is not an integer! strconv.Atoi: parsing \"fsdkkd\": invalid syntax", ex)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex, errors = csr.TransferTokens(transactionContext, s)
	require.EqualError(test, errors, "No such project exists!", ex)

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	ex1, err = csr.TransferTokens(transactionContext, s)
	require.EqualError(test, err, "only corporate can initiate transferTokens", ex1)

	transactionContext, chaincodeStub = prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(lowBalance), nil)
	ex, errors = csr.TransferTokens(transactionContext, s)
	require.EqualError(test, errors, "Not enough balance. Available balance: 1.00", ex)

	transactionContext, chaincodeStub = prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex, errors = csr.TransferTokens(transactionContext, s)
	require.EqualError(test, errors, "Funding is not allowed to this phase!", ex)

}

func TestAssignTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	bxId := "2435678"
	date := "27"
	txId := "45678234567"
	var arg [3]string
	arg[0] = bxId
	arg[1] = date
	arg[2] = txId

	jsonarg, _ := json.Marshal(arg)
	s := string(jsonarg)

	Status := "Requested"
	comments := "Requested"

	req := main.TokenRequest{
		ObjectType: "TokenRequest",
		From:       "keanu.corporate.csr.com",
		Qty:        1000,
		Status:     Status,
		Date:       15,
		PaymentId:  bxId,
		Comments:   comments,
	}
	tokenreqBytes, _ := json.Marshal(req)

	req1 := main.TokenRequest{
		ObjectType: "TokenRequest",
		From:       "keanu.corporate.csr.com",
		Qty:        1000,
		Status:     "Assigned",
		Date:       15,
		PaymentId:  bxId,
		Comments:   comments,
	}
	tokenreqBytes1, _ := json.Marshal(req1)

	var arg1 [2]string
	jsonarg1, _ := json.Marshal(arg1)
	s1 := string(jsonarg1)

	var arg2 [3]string
	jsonarg2, _ := json.Marshal(arg2)
	s2 := string(jsonarg2)

	var arg3 [3]string
	arg3[0] = bxId
	jsonarg3, _ := json.Marshal(arg3)
	s3 := string(jsonarg3)

	var arg4 [3]string
	arg4[0] = bxId
	arg4[1] = date
	jsonarg4, _ := json.Marshal(arg4)
	s4 := string(jsonarg4)

	var arg5 [3]string
	arg5[0] = bxId
	arg5[1] = "date"
	arg5[2] = txId

	jsonarg5, _ := json.Marshal(arg5)
	s5 := string(jsonarg5)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("1000"), nil)
	_, er := csr.AssignTokens(transactionContext, s)
	require.NoError(test, er)

	_, er = csr.AssignTokens(transactionContext, s)
	require.EqualError(test, er, "No such token request exists")

	_, er = csr.AssignTokens(transactionContext, s1)
	require.EqualError(test, er, "Incorrect number of arguments. Expecting 3")

	_, er = csr.AssignTokens(transactionContext, s2)
	require.EqualError(test, er, "bank tx id must be a non-empty string")

	_, er = csr.AssignTokens(transactionContext, s3)
	require.EqualError(test, er, "date must be a non-empty string")

	_, er = csr.AssignTokens(transactionContext, s4)
	require.EqualError(test, er, "tx id must be a non-empty string")

	_, er = csr.AssignTokens(transactionContext, s5)
	require.EqualError(test, er, "strconv.Atoi: parsing \"date\": invalid syntax")

	transactionContext, chaincodeStub = prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	ex1, err := csr.AssignTokens(transactionContext, s)
	require.EqualError(test, err, "only creditsauthority can initiate assignTokens", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("1000"), nil)
	_, er = csr.AssignTokens(transactionContext, s)
	require.EqualError(test, er, "TokenRequest with id: 2435678 is already Assigned")

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("1000"), nil)
	chaincodeStub.GetStateReturnsOnCall(2, []byte(txId), nil)
	_, er = csr.AssignTokens(transactionContext, s)
	require.EqualError(test, er, "Failed to add a Tx: tx id already exists")

}

func TestRejectTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	bxId := "2435678"
	comments := "Rejected"
	date := "27"
	txId := "4567823456723456s"
	var arg [4]string
	arg[0] = bxId
	arg[1] = comments
	arg[2] = date
	arg[3] = txId

	jsonarg, _ := json.Marshal(arg)
	s := string(jsonarg)

	Status := "Requested"
	req := main.TokenRequest{
		ObjectType: "TokenRequest",
		From:       "keanu.corporate.csr.com",
		Qty:        1000,
		Status:     Status,
		Date:       15,
		PaymentId:  bxId,
		Comments:   comments,
	}
	tokenreqBytes, _ := json.Marshal(req)

	req1 := main.TokenRequest{
		ObjectType: "TokenRequest",
		From:       "keanu.corporate.csr.com",
		Qty:        1000,
		Status:     "Status",
		Date:       15,
		PaymentId:  bxId,
		Comments:   comments,
	}
	tokenreqBytes1, _ := json.Marshal(req1)

	var arg1 [3]string
	jsonarg1, _ := json.Marshal(arg1)
	s1 := string(jsonarg1)

	var arg2 [4]string
	jsonarg2, _ := json.Marshal(arg2)
	s2 := string(jsonarg2)

	var arg3 [4]string
	arg3[0] = bxId
	jsonarg3, _ := json.Marshal(arg3)
	s3 := string(jsonarg3)

	var arg4 [4]string
	arg4[0] = bxId
	arg4[1] = comments
	jsonarg4, _ := json.Marshal(arg4)
	s4 := string(jsonarg4)

	var arg5 [4]string
	arg5[0] = bxId
	arg5[1] = comments
	arg5[2] = date
	jsonarg5, _ := json.Marshal(arg5)
	s5 := string(jsonarg5)

	var arg6 [4]string
	arg6[0] = bxId
	arg6[1] = comments
	arg6[2] = "date"
	arg6[3] = txId

	jsonarg6, _ := json.Marshal(arg6)
	s6 := string(jsonarg6)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er := csr.RejectTokens(transactionContext, s)
	require.NoError(test, er)

	_, er = csr.RejectTokens(transactionContext, s)
	require.EqualError(test, er, "No such TokenRequest exists")

	_, er = csr.RejectTokens(transactionContext, s1)
	require.EqualError(test, er, "Incorrect number of arguments. Expecting 4")

	_, er = csr.RejectTokens(transactionContext, s2)
	require.EqualError(test, er, "bankTxId must be non-empty")

	_, er = csr.RejectTokens(transactionContext, s3)
	require.EqualError(test, er, "comments must be non-empty")

	_, er = csr.RejectTokens(transactionContext, s4)
	require.EqualError(test, er, "date must be non-empty")

	_, er = csr.RejectTokens(transactionContext, s5)
	require.EqualError(test, er, "tx Id must be non-empty")

	_, er = csr.RejectTokens(transactionContext, s6)
	require.EqualError(test, er, "strconv.Atoi: parsing \"date\": invalid syntax")

	transactionContext, chaincodeStub = prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	ex1, err := csr.RejectTokens(transactionContext, s)
	require.EqualError(test, err, "only creditsauthority can initiate rejectTokens", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes1, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.RejectTokens(transactionContext, s)
	require.EqualError(test, er, "Invalid status, TokenRequest's Status should be Requested")

	transactionContext, chaincodeStub = prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	transactionContext, chaincodeStub = prepMocksAsCa3()
	transactionContext.GetStubReturns(chaincodeStub)

	chaincodeStub.GetStateReturnsOnCall(0, tokenreqBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(txId), nil)
	_, er = csr.RejectTokens(transactionContext, s)
	require.EqualError(test, er, "Failed to add a Tx: tx id already exists")

}
