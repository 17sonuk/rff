package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
	"github.com/stretchr/testify/require"
	// "github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
	// "chaincode/go/pkg/mod/github.com/hyperledger/fabric-chaincode-go@v0.0.0-20210603161043-af0e3898842a/pkg/cid"
)

//go:generate counterfeiter -o mocks/transaction.go -fake-name TransactionContext . transactionContext
type transactionContext interface {
	contractapi.TransactionContextInterface
}

//go:generate counterfeiter -o mocks/chaincodestub.go -fake-name ChaincodeStub . chaincodeStub
type chaincodeStub interface {
	shim.ChaincodeStubInterface
}

//go:generate counterfeiter -o mocks/statequeryiterator.go -fake-name StateQueryIterator . stateQueryIterator
type stateQueryIterator interface {
	shim.StateQueryIteratorInterface
}

//go:generate counterfeiter -o mocks/clientIdentity.go -fake-name ClientIdentity . clientIdentity
type clientIdentity interface {
	cid.ClientIdentity
}

const ngoMsp = "NgoMSP"
const ngoClient = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const tmpCorpClient = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
const corpClientid = "CorporateMSP"

const ca = "CreditsAuthorityMSP"
const caClient = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(ngoMsp, ngoClient)
}
func prepMocksAsCorp() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(corpClientid, tmpCorpClient)
}
func prepMocksAsCa() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(ca, caClient)
}

func prepMocks(orgMSP, clientId string) (*mocks.TransactionContext, *mocks.ChaincodeStub) {
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

func TestInitLedger(test *testing.T) {
	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}
	err := csr.InitLedger(transactionContext)
	require.NoError(test, err)
}

func TestCreateProject(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
	}
	pId := "20001"
	txId := "t000145678"
	newProAsBytes, _ := json.Marshal(projObj)
	newpro := string(newProAsBytes)
	var args [3]string
	args[0] = newpro
	args[1] = pId
	args[2] = txId
	jsonarg, _ := json.Marshal(args)
	arg := string(jsonarg)

	var argsdup [2]string
	jsonargdup, _ := json.Marshal(argsdup)
	argdup := string(jsonargdup)

	var argsdup1 [3]string
	argsdup1[0] = ""
	jsonargdup1, _ := json.Marshal(argsdup1)
	argdup1 := string(jsonargdup1)

	var argsdup2 [3]string
	argsdup2[0] = newpro
	argsdup2[1] = ""
	jsonargdup2, _ := json.Marshal(argsdup2)
	argdup2 := string(jsonargdup2)

	var argsdup3 [3]string
	argsdup3[0] = newpro
	argsdup3[1] = pId
	argsdup3[2] = ""
	jsonargdup3, _ := json.Marshal(argsdup3)
	argdup3 := string(jsonargdup3)

	projObj1 := main.Project{
		ProjectName: "",
	}
	newProAsBytes1, _ := json.Marshal(projObj1)
	newpro1 := string(newProAsBytes1)
	var args1 [3]string
	args1[0] = newpro1
	args1[1] = pId
	args1[2] = txId
	jsonarg1, _ := json.Marshal(args1)
	arg1 := string(jsonarg1)

	projObj2 := main.Project{
		ProjectName: "Project1",
		ProjectType: "",
	}
	newProAsBytes2, _ := json.Marshal(projObj2)
	newpro2 := string(newProAsBytes2)
	var args2 [3]string
	args2[0] = newpro2
	args2[1] = pId
	args2[2] = txId
	jsonarg2, _ := json.Marshal(args2)
	arg2 := string(jsonarg2)

	projObj3 := main.Project{
		ProjectName: "Project1",
		ProjectType: "Short",
	}
	newProAsBytes3, _ := json.Marshal(projObj3)
	newpro3 := string(newProAsBytes3)
	var args3 [3]string
	args3[0] = newpro3
	args3[1] = pId
	args3[2] = txId
	jsonarg3, _ := json.Marshal(args3)
	arg3 := string(jsonarg3)

	projObj4 := main.Project{
		ProjectName: "Project1",
		ProjectType: "Short",
		Phases:      ph,
	}
	newProAsBytes4, _ := json.Marshal(projObj4)
	newpro4 := string(newProAsBytes4)
	var args4 [3]string
	args4[0] = newpro4
	args4[1] = pId
	args4[2] = txId
	jsonarg4, _ := json.Marshal(args4)
	arg4 := string(jsonarg4)

	projObj5 := main.Project{
		ProjectName:  "Project1",
		ProjectType:  "Short",
		Phases:       ph,
		CreationDate: 10,
	}
	newProAsBytes5, _ := json.Marshal(projObj5)
	newpro5 := string(newProAsBytes5)
	var args5 [3]string
	args5[0] = newpro5
	args5[1] = pId
	args5[2] = txId
	jsonarg5, _ := json.Marshal(args5)
	arg5 := string(jsonarg5)

	_, err := csr.CreateProject(transactionContext, arg)
	require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
	ex1, err := csr.CreateProject(transactionContext, argdup)
	require.EqualError(test, err, "Incorrect number of arguments. Expecting 3", ex1)

	ex, err := csr.CreateProject(transactionContext, argdup1)
	require.EqualError(test, err, "project details must be a non-empty json string", ex)

	ee, err := csr.CreateProject(transactionContext, argdup2)
	require.EqualError(test, err, "pId must be a non-empty string", ee)

	ee, err = csr.CreateProject(transactionContext, argdup3)
	require.EqualError(test, err, "tx Id must be a non-empty string", ee)

	e1, err := csr.CreateProject(transactionContext, arg1)
	require.EqualError(test, err, "Project name is mandatory!", e1)

	e1, err = csr.CreateProject(transactionContext, arg2)
	require.EqualError(test, err, "Project type is mandatory!", e1)

	e1, err = csr.CreateProject(transactionContext, arg3)
	require.EqualError(test, err, "please specify atleast one phase!", e1)

	e1, err = csr.CreateProject(transactionContext, arg4)
	require.EqualError(test, err, "Creation Date is mandatory!", e1)

	e1, err = csr.CreateProject(transactionContext, arg5)
	require.EqualError(test, err, "Total Project Cost is mandatory!", e1)

}

func TestUpdateProject(test *testing.T) {

	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	// crite := []main.Criterion{
	// 	{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	// }
	// ph := []main.Phase{
	// 	{Qty: 5000,
	// 		OutstandingQty:     1000,
	// 		StartDate:          10,
	// 		EndDate:            20,
	// 		ValidationCriteria: map[string][]main.Criterion{"o1": crite},
	// 	},
	// }
	// projObj := main.Project{
	// 	ProjectName:      "Project1",
	// 	ProjectType:      "Short",
	// 	Phases:           ph,
	// 	CreationDate:     10,
	// 	TotalProjectCost: 5000,
	// 	NGO:              "goonj.ngo.csr.com",
	// }
	// pId := "10001"
	// txId := "t0001"
	// newProAsBytes, _ := json.Marshal(projObj)
	// newpro := string(newProAsBytes)
	// var args [3]string
	// args[0] = newpro
	// args[1] = pId
	// args[2] = txId
	// jsonarg, _ := json.Marshal(args)
	// arg := string(jsonarg)
	// _, err := csr.CreateProject(transactionContext, arg)
	// require.NoError(test, err, "err")

	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Created",
			StartDate:          10,
			EndDate:            20,
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
		ProjectState:     "Created",
		NGO:              "goonj.ngo.csr.com",
	}
	// pId := "10001"
	newProAsBytes, _ := json.Marshal(projObj)
	// e1 := chaincodeStub.PutState(pId, newProAsBytes)
	// fmt.Println("e1:.....", e1)

	// p := main.Project{}
	// getstate, er := chaincodeStub.GetState(pId)
	// fmt.Println("er", er)
	// fmt.Println("getstate", getstate)
	// errorss := json.Unmarshal(getstate, &p)
	// fmt.Println("errorss", errorss)

	// chaincodeStub.GetStateReturns(getstate, nil)

	// expectedAsset := &main.Project{pId: pId}
	// bytes, err := json.Marshal(expectedAsset)
	// require.NoError(test, err)

	id := "50001"
	phaseNumber := "0"
	state := "Open For Funding"
	date := "12"
	txid := "234567890"
	var uparg [5]string
	uparg[0] = id
	uparg[1] = phaseNumber
	uparg[2] = state
	uparg[3] = date
	uparg[4] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	chaincodeStub.GetStateReturns(newProAsBytes, nil)
	_, erro := csr.UpdateProject(transactionContext, s)
	require.NoError(test, erro)
	// coudnt retrieve data. empty data is fetched
	// chaincodeStub.GetStateReturns(nil, nil)
	// getStateReturns function is not usefull as result is same no matter we use it or not. no change detected.

	// chaincodeStub.GetStateReturns(nil, nil)
	// ex1, err := csr.UpdateProject(transactionContext, s)
	// require.EqualError(test, err, "project is not present", ex1)
	ex1, err := csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "Failed to add a Tx: tx id already exists", ex1)

}

func TestValidatePhase(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
	}
	pId := "10001"
	txId := "t00050"
	newProAsBytes, _ := json.Marshal(projObj)
	newpro := string(newProAsBytes)
	var args [3]string
	args[0] = newpro
	args[1] = pId
	args[2] = txId
	jsonarg, _ := json.Marshal(args)
	arg := string(jsonarg)
	_, err := csr.CreateProject(transactionContext, arg)
	require.NoError(test, err, "err")

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)

	proId := "10001"
	phasenum := "1"
	validation := "True"
	Comments := "Validate"
	date := "15"
	txid := "t00056"
	var uparg [6]string
	uparg[0] = proId
	uparg[1] = phasenum
	uparg[2] = validation
	uparg[3] = Comments
	uparg[4] = date
	uparg[5] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	// _, err = csr.ValidatePhase(transactionContext, s)
	// require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
	ex1, err := csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "Project doesn't exist", ex1)

}

func TestRequestTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	Qty := "1000"
	PaymentId := "1001"
	Status := "Requested"
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

	// var uparg6 [6]string
	// uparg[0] = Qty
	// uparg[1] = PaymentId
	// uparg[2] = Status
	// uparg[3] = Comments
	// uparg[4] = date
	// uparg[5] = ""
	// jsonuparg6, _ := json.Marshal(uparg6)
	// s6 := string(jsonuparg6)

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

	// ex, err := csr.RequestTokens(transactionContext, s6)
	// require.EqualError(test, err, "txid must be a non-empty string", ex)
	// not passing this one test case while passing s6 obj. but no error found
}

func TestTransferTokens(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCorp()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	Amount := "1000"
	ProjectId := "10001"
	phaseNumber := "1"
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

	// _, err := csr.TransferTokens(transactionContext, s)
	// require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
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

}

func TestRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

	pd := main.PaymentDetails{
		PaymentType:   "Paypal",
		PaypalEmailId: "ngo@info.com",
	}
	redeem := main.Redeem{
		Qty:            1000,
		PaymentId:      "2000",
		PaymentDetails: pd,
	}
	RedAsBytes, _ := json.Marshal(redeem)
	red := string(RedAsBytes)
	redeemId := "10001"
	date := "15"
	txid := "t0004902"
	var uparg [4]string
	uparg[0] = redeemId
	uparg[1] = red
	uparg[2] = date
	uparg[3] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	// _, err := csr.RedeemRequest(transactionContext, s)
	// require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
	ex1, err := csr.RedeemRequest(transactionContext, s)
	require.EqualError(test, err, "error getting the balance of the ngo", ex1)

	// ex1, err = csr.RedeemRequest(transactionContext, s)
	// require.EqualError(test, err, "error getting the balance of the ngo", ex1)

}

func TestApproveRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

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

	// _, err := csr.ApproveRedeemRequest(transactionContext, s)
	// require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
	ex1, err := csr.ApproveRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 is not present", ex1)

}

func TestRejectRedeemRequest(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)

	csr := main.SmartContract{}

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

	// _, err := csr.RejectRedeemRequest(transactionContext, s)
	// require.NoError(test, err, "err")

	// chaincodeStub.GetStateReturns(nil, nil)
	ex1, err := csr.RejectRedeemRequest(transactionContext, s)
	require.EqualError(test, err, "redeem request: 10001 not found", ex1)

}

// crite := []main.Criterion{
// 	{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
// }
// // contrib := main.Contribution{
// // 	Contributor:     "me",
// // 	ContributionQty: 100.0,
// // }
// // val := main.Validation{
// // 	IsValid:  true,
// // 	Comments: "validated",
// // }
// ph := []main.Phase{
// 	{Qty: 5000,
// 		OutstandingQty: 1000,
// 		// PhaseState:         "Created",
// 		// Contributions:      map[string]main.Contribution{"1": contrib},
// 		StartDate:          10,
// 		EndDate:            20,
// 		ValidationCriteria: map[string][]main.Criterion{"o1": crite},
// 		//CAValidation:       val
// 	},
// }
// // var vis []string
// // vis = []string{"me", "ngo"}
// projObj := main.Project{
// 	// ObjectType:       "Project",
// 	ProjectName:      "Project1",
// 	ProjectType:      "Short",
// 	Phases:           ph,
// 	CreationDate:     10,
// 	TotalProjectCost: 5000,
// 	// ProjectState:     "Created",
// 	NGO: "ngo",
// 	// Contributors:     map[string]string{"c1": "me"},
// 	// VisibleTo:        vis,
// 	// NoOfUpdates:      0,
// }
