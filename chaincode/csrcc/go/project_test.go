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

const ngoMsp = "NgoMSP"
const ngoClient = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

// const tmpCorpClient = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
// const corpClientid = "CorporateMSP"

const ca = "CreditsAuthorityMSP"
const caClient = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(ngoMsp, ngoClient)
}

// func prepMocksAsCorp() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
// 	return prepMocks(corpClientid, tmpCorpClient)
// }
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
	newProAsBytes, _ := json.Marshal(projObj)

	id := "50001"
	phaseNumber := "0"
	state := "Open For Funding"
	date := "12"
	txid := "2345678901234567890qwertyui234567890"
	var uparg [5]string
	uparg[0] = id
	uparg[1] = phaseNumber
	uparg[2] = state
	uparg[3] = date
	uparg[4] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, erro := csr.UpdateProject(transactionContext, s)
	require.NoError(test, erro)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err := csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "project is not present", ex1)

}

func TestValidatePhase(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	val := main.Validation{
		IsValid:  true,
		Comments: "Validated",
	}
	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Seeking Validation",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
			CAValidation:       val,
		},
	}
	projObj := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes, _ := json.Marshal(projObj)

	// ca validates
	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)

	proId := "10001"
	phasenum := "0"
	validation := "true"
	Comments := "Validated"
	date := "15"
	txid := "t000563456"

	var uparg [6]string
	uparg[0] = proId
	uparg[1] = phasenum
	uparg[2] = validation
	uparg[3] = Comments
	uparg[4] = date
	uparg[5] = txid
	jsonuparg, _ := json.Marshal(uparg)
	s := string(jsonuparg)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, err := csr.ValidatePhase(transactionContext, s)
	require.NoError(test, err, "err")

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err := csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "Project doesn't exist", ex1)

}

func TestAddDocumentHash(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	csr := main.SmartContract{}

	val := main.Validation{
		IsValid:  true,
		Comments: "Validated",
	}
	crite := []main.Criterion{
		{Desc: "Nothing", DocName: "Nothing", DocHash: "asdf"},
	}
	ph := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Seeking Validation",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"Criteria": crite},
			CAValidation:       val,
		},
	}
	projObj := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes, _ := json.Marshal(projObj)

	prodId := "500001"
	phaseNum := "0"
	criterion := "Criteria"
	docHash := "asdfghjk"
	docName := "Proof"
	date := "29"
	txid := "234567890987654"
	var arg [7]string
	arg[0] = prodId
	arg[1] = phaseNum
	arg[2] = criterion
	arg[3] = docHash
	arg[4] = docName
	arg[5] = date
	arg[6] = txid
	jsonarg, _ := json.Marshal(arg)
	s := string(jsonarg)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er := csr.AddDocumentHash(transactionContext, s)
	require.NoError(test, er)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, er, "Project doesn't exist")

}
