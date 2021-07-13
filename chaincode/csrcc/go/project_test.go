package main

import (
	main "csrcc/go"
	"encoding/json"
	"os"
	"testing"

	mocks "csrcc/go/mocks"

	"github.com/hyperledger/fabric-protos-go/ledger/queryresult"
	"github.com/stretchr/testify/require"
	// "github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	// "github.com/hyperledger/fabric-chaincode-go/shim"
	// "github.com/hyperledger/fabric-contract-api-go/contractapi"
	// "github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-private-data/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
)

const ngoMsp = "NgoMSP"
const ngoClient = "eDUwOTo6Q049Z29vbmosT1U9Y2xpZW50K09VPW5nbytPVT1kZXBhcnRtZW50MTo6Q049Y2EubmdvLmNzci5jb20sTz1uZ28uY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

const tmpCorpClient0 = "eDUwOTo6Q049a2VhbnUsT1U9Y2xpZW50K09VPWNvcnBvcmF0ZStPVT1kZXBhcnRtZW50MTo6Q049Y2EuY29ycG9yYXRlLmNzci5jb20sTz1jb3Jwb3JhdGUuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"
const corpClientid0 = "CorporateMSP"

const ca = "CreditsAuthorityMSP"
const caClient = "eDUwOTo6Q049cmZmdXMsT1U9Y2xpZW50K09VPWNyZWRpdHNhdXRob3JpdHkrT1U9ZGVwYXJ0bWVudDE6OkNOPWNhLmNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxPPWNyZWRpdHNhdXRob3JpdHkuY3NyLmNvbSxMPUR1cmhhbSxTVD1Ob3J0aCBDYXJvbGluYSxDPVVT"

func prepMocksAsNgo() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(ngoMsp, ngoClient)
}

func prepMocksAsCorp0() (*mocks.TransactionContext, *mocks.ChaincodeStub) {
	return prepMocks(corpClientid0, tmpCorpClient0)
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

	//04

	ph04 := []main.Phase{
		{Qty: 5000,
			OutstandingQty: 1000,
			StartDate:      10,
			EndDate:        20,
		},
	}
	projObj04 := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph04,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes04, _ := json.Marshal(projObj04)
	newpro04 := string(newProAsBytes04)
	var args04 [3]string
	args04[0] = newpro04
	args04[1] = pId
	args04[2] = txId
	jsonarg04, _ := json.Marshal(args04)
	arg04 := string(jsonarg04)

	//03
	ph03 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			StartDate:          29,
			EndDate:            30,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
			Contributions:      map[string]main.Contribution{"1": {"me", 100.0}},
		},
	}
	projObj03 := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph03,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes03, _ := json.Marshal(projObj03)
	newpro03 := string(newProAsBytes03)
	var args03 [3]string
	args03[0] = newpro03
	args03[1] = pId
	args03[2] = txId
	jsonarg03, _ := json.Marshal(args03)
	arg03 := string(jsonarg03)

	//02
	ph02 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			StartDate:          29,
			EndDate:            29,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj02 := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph02,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes02, _ := json.Marshal(projObj02)
	newpro02 := string(newProAsBytes02)
	var args02 [3]string
	args02[0] = newpro02
	args02[1] = pId
	args02[2] = txId
	jsonarg02, _ := json.Marshal(args02)
	arg02 := string(jsonarg02)

	//01
	projObj01 := main.Project{
		ProjectName:      "Project1",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		NGO:              "goonj.ngo.csr.com",
		Contributors:     map[string]string{"1": "me"},
	}
	newProAsBytes01, _ := json.Marshal(projObj01)
	newpro01 := string(newProAsBytes01)
	var args01 [3]string
	args01[0] = newpro01
	args01[1] = pId
	args01[2] = txId
	jsonarg01, _ := json.Marshal(args01)
	arg01 := string(jsonarg01)

	//dummy
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

	e1, err = csr.CreateProject(transactionContext, arg01)
	require.EqualError(test, err, "Contributors should be none!", e1)

	transactionContext, chaincodeStub = prepMocksAsCorp0()
	transactionContext.GetStubReturns(chaincodeStub)
	e1, err = csr.CreateProject(transactionContext, arg)
	require.EqualError(test, err, "only ngo can initiate createProject", e1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	e1, err = csr.CreateProject(transactionContext, arg)
	require.EqualError(test, err, "Project with this pId already exists", e1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	squery := "{\"selector\":{\"docType\":\"Project\"}}, projectName: 'project1'"
	iterator := &mocks.StateQueryIterator{}
	iterator.HasNextReturnsOnCall(0, true)
	iterator.HasNextReturnsOnCall(1, true)
	iterator.HasNextReturnsOnCall(2, true)
	iterator.HasNextReturnsOnCall(3, false)
	iterator.NextReturns(&queryresult.KV{Value: []byte(squery)}, nil)
	chaincodeStub.GetQueryResultReturns(iterator, nil)
	ex1, err = csr.CreateProject(transactionContext, arg)
	require.EqualError(test, err, "A project with the same name already exists!", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	e1, err = csr.CreateProject(transactionContext, arg02)
	require.EqualError(test, err, "end date must be ahead of start date!", e1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	e1, err = csr.CreateProject(transactionContext, arg03)
	require.EqualError(test, err, "No phase contributions expected!", e1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	e1, err = csr.CreateProject(transactionContext, arg04)
	require.EqualError(test, err, "Please provide atleast one validation criteria!", e1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(1, []byte(txId), nil)
	e1, err = csr.CreateProject(transactionContext, arg)
	require.EqualError(test, err, "Failed to add a Tx: tx id already exists", e1)

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

	//owner
	projObj001 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "dasdfgh",
	}
	newProAsBytes001, _ := json.Marshal(projObj001)

	//state
	ph02 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "sadfg",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj02 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph02,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes02, _ := json.Marshal(projObj02)

	//phasenumber
	ph03 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Created",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Created",
			StartDate:          20,
			EndDate:            30,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj03 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph03,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes03, _ := json.Marshal(projObj03)
	id03 := "50001"
	phaseNumber03 := "1"
	state03 := "Open For Funding"
	date03 := "12"
	txid03 := "2345678901234567890qwertyui234567890"
	var uparg03 [5]string
	uparg03[0] = id03
	uparg03[1] = phaseNumber03
	uparg03[2] = state03
	uparg03[3] = date03
	uparg03[4] = txid03
	jsonuparg03, _ := json.Marshal(uparg03)
	s03 := string(jsonuparg03)

	//
	//seeking validation
	ph04 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "sadfg",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj04 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph04,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes04, _ := json.Marshal(projObj04)
	id04 := "50001"
	phaseNumber04 := "0"
	state04 := "Seeking Validation"
	date04 := "12"
	txid04 := "2345678901234567890qwertyui234567890"
	var uparg04 [5]string
	uparg04[0] = id04
	uparg04[1] = phaseNumber04
	uparg04[2] = state04
	uparg04[3] = date04
	uparg04[4] = txid04
	jsonuparg04, _ := json.Marshal(uparg04)
	s04 := string(jsonuparg04)

	//Complete
	ph05 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "sadfg",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		},
	}
	projObj05 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph05,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes05, _ := json.Marshal(projObj05)
	id05 := "50001"
	phaseNumber05 := "0"
	state05 := "Complete"
	date05 := "12"
	txid05 := "2345678901234567890qwertyui234567890"
	var uparg05 [5]string
	uparg05[0] = id05
	uparg05[1] = phaseNumber05
	uparg05[2] = state05
	uparg05[3] = date05
	uparg05[4] = txid05
	jsonuparg05, _ := json.Marshal(uparg05)
	s05 := string(jsonuparg05)

	id06 := "50001"
	phaseNumber06 := "0"
	state06 := "sdfghhj"
	date06 := "12"
	txid06 := "2345678901234567890qwertyui234567890"
	var uparg06 [5]string
	uparg06[0] = id06
	uparg06[1] = phaseNumber06
	uparg06[2] = state06
	uparg06[3] = date06
	uparg06[4] = txid06
	jsonuparg06, _ := json.Marshal(uparg06)
	s06 := string(jsonuparg06)

	var uparg1 [5]string
	uparg1[0] = id
	uparg1[1] = "-1"
	uparg1[2] = state
	uparg1[3] = date
	uparg1[4] = txid
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [5]string
	uparg2[0] = id
	uparg2[1] = phaseNumber
	uparg2[2] = state
	uparg2[3] = "date"
	uparg2[4] = txid
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, erro := csr.UpdateProject(transactionContext, s)
	require.NoError(test, erro)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err := csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "project is not present", ex1)

	transactionContext, chaincodeStub = prepMocksAsCorp0()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "only ngo can initiate UpdateProject", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.UpdateProject(transactionContext, s1)
	require.EqualError(test, err, "Invalid phase number!", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.UpdateProject(transactionContext, s2)
	require.EqualError(test, err, "date should be numeric.", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes001, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "Invalid project owner", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes02, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "Only created state can be opened for funding", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes03, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s03)
	require.EqualError(test, err, "previous phase is not Complete", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes04, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s04)
	require.EqualError(test, err, "current phase is in an invalid state to seek validation", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes05, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s05)
	require.EqualError(test, err, "current phase is not yet validated to be marked complete", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes05, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.UpdateProject(transactionContext, s06)
	require.EqualError(test, err, "state can be Open For Funding or Seeking Validation or Complete", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("345678"), nil)
	ex1, err = csr.UpdateProject(transactionContext, s)
	require.EqualError(test, err, "Failed to add a Tx: tx id already exists", ex1)

}

func TestValidatePhase(test *testing.T) {
	transactionContext, chaincodeStub := prepMocksAsCa()
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

	//invalid phase
	ph02 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Seeking Validation",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
			CAValidation:       val,
		},
		// {Qty: 5000,
		// 	OutstandingQty:     1000,
		// 	PhaseState:         "Seeking Validation",
		// 	StartDate:          20,
		// 	EndDate:            30,
		// 	ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		// 	CAValidation:       val,
		// },
	}
	projObj02 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph02,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes02, _ := json.Marshal(projObj02)
	phasenum02 := "1"
	var uparg02 [6]string
	uparg02[0] = proId
	uparg02[1] = phasenum02
	uparg02[2] = validation
	uparg02[3] = Comments
	uparg02[4] = date
	uparg02[5] = txid
	jsonuparg02, _ := json.Marshal(uparg02)
	s02 := string(jsonuparg02)

	//seeking validation
	ph03 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "sdfghj",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"o1": crite},
			CAValidation:       val,
		},
		// {Qty: 5000,
		// 	OutstandingQty:     1000,
		// 	PhaseState:         "Seeking Validation",
		// 	StartDate:          20,
		// 	EndDate:            300,
		// 	ValidationCriteria: map[string][]main.Criterion{"o1": crite},
		// 	CAValidation:       val,
		// },
	}
	projObj03 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph03,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes03, _ := json.Marshal(projObj03)

	var uparg1 [2]string
	jsonuparg1, _ := json.Marshal(uparg1)
	s1 := string(jsonuparg1)

	var uparg2 [6]string
	jsonuparg2, _ := json.Marshal(uparg2)
	s2 := string(jsonuparg2)

	var uparg3 [6]string
	uparg3[0] = proId
	jsonuparg3, _ := json.Marshal(uparg3)
	s3 := string(jsonuparg3)

	var uparg4 [6]string
	uparg4[0] = proId
	uparg4[1] = phasenum
	jsonuparg4, _ := json.Marshal(uparg4)
	s4 := string(jsonuparg4)

	var uparg5 [6]string
	uparg5[0] = proId
	uparg5[1] = phasenum
	uparg5[2] = validation
	uparg5[3] = Comments
	jsonuparg5, _ := json.Marshal(uparg5)
	s5 := string(jsonuparg5)

	var uparg6 [6]string
	uparg6[0] = proId
	uparg6[1] = phasenum
	uparg6[2] = validation
	uparg6[3] = Comments
	uparg6[4] = date
	jsonuparg6, _ := json.Marshal(uparg6)
	s6 := string(jsonuparg6)

	var uparg7 [6]string
	uparg7[0] = proId
	uparg7[1] = "-1"
	uparg7[2] = validation
	uparg7[3] = Comments
	uparg7[4] = date
	uparg7[5] = txid
	jsonuparg7, _ := json.Marshal(uparg7)
	s7 := string(jsonuparg7)

	var uparg8 [6]string
	uparg8[0] = proId
	uparg8[1] = phasenum
	uparg8[2] = "false"
	// uparg8[3] = Comments
	uparg8[4] = date
	uparg8[5] = txid
	jsonuparg8, _ := json.Marshal(uparg8)
	s8 := string(jsonuparg8)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, err := csr.ValidatePhase(transactionContext, s)
	require.NoError(test, err, "err")

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err := csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "Project doesn't exist", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "only creditsauthority can initiate ValidatePhase", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s1)
	require.EqualError(test, err, "Incorrect number of arguments. Expecting 6", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s2)
	require.EqualError(test, err, "project id must be a non-empty json string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s3)
	require.EqualError(test, err, "phase No. must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s4)
	require.EqualError(test, err, "validation must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s5)
	require.EqualError(test, err, "date must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s6)
	require.EqualError(test, err, "tx Id must be a non-empty string", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	ex1, err = csr.ValidatePhase(transactionContext, s7)
	require.EqualError(test, err, "Invalid phase number!", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes02, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.ValidatePhase(transactionContext, s02)
	require.EqualError(test, err, "Invalid phase number!", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes03, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "The phase must be in Seeking Validation state!", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.ValidatePhase(transactionContext, s8)
	require.EqualError(test, err, "comments are mandatory!", ex1)

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("34567"), nil)
	ex1, err = csr.ValidatePhase(transactionContext, s)
	require.EqualError(test, err, "tx id already exists", ex1)

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

	//cant upload doc
	ph01 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Validated",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"Criteria": crite},
			CAValidation:       val,
		},
	}
	projObj01 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph01,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes01, _ := json.Marshal(projObj01)

	//owner
	projObj001 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Created",
		NGO:              "dasdfgh",
	}
	newProAsBytes001, _ := json.Marshal(projObj001)

	//criteria doesnt exist
	ph03 := []main.Phase{
		{Qty: 5000,
			OutstandingQty:     1000,
			PhaseState:         "Seeking Validation",
			StartDate:          10,
			EndDate:            20,
			ValidationCriteria: map[string][]main.Criterion{"Criteria": nil},
			CAValidation:       val,
		},
	}
	projObj03 := main.Project{
		ObjectType:       "Project",
		ProjectName:      "Project10",
		ProjectType:      "Short",
		Phases:           ph03,
		CreationDate:     10,
		TotalProjectCost: 5000,
		ProjectState:     "Fully Funded",
		NGO:              "goonj.ngo.csr.com",
	}
	newProAsBytes03, _ := json.Marshal(projObj03)

	var arg1 [2]string
	jsonarg1, _ := json.Marshal(arg1)
	s1 := string(jsonarg1)

	var arg2 [7]string
	jsonarg2, _ := json.Marshal(arg2)
	s2 := string(jsonarg2)

	var arg3 [7]string
	arg3[0] = prodId
	jsonarg3, _ := json.Marshal(arg3)
	s3 := string(jsonarg3)

	var arg4 [7]string
	arg4[0] = prodId
	arg4[1] = phaseNum
	jsonarg4, _ := json.Marshal(arg4)
	s4 := string(jsonarg4)

	var arg5 [7]string
	arg5[0] = prodId
	arg5[1] = phaseNum
	arg5[2] = criterion
	jsonarg5, _ := json.Marshal(arg5)
	s5 := string(jsonarg5)

	var arg6 [7]string
	arg6[0] = prodId
	arg6[1] = phaseNum
	arg6[2] = criterion
	arg6[3] = docHash
	jsonarg6, _ := json.Marshal(arg6)
	s6 := string(jsonarg6)

	var arg7 [7]string
	arg7[0] = prodId
	arg7[1] = phaseNum
	arg7[2] = criterion
	arg7[3] = docHash
	arg7[4] = docName
	jsonarg7, _ := json.Marshal(arg7)
	s7 := string(jsonarg7)

	var arg8 [7]string
	arg8[0] = prodId
	arg8[1] = phaseNum
	arg8[2] = criterion
	arg8[3] = docHash
	arg8[4] = docName
	arg8[5] = date
	jsonarg8, _ := json.Marshal(arg8)
	s8 := string(jsonarg8)

	var arg9 [7]string
	arg9[0] = prodId
	arg9[1] = "-1"
	arg9[2] = criterion
	arg9[3] = docHash
	arg9[4] = docName
	arg9[5] = date
	arg9[6] = txid
	jsonarg9, _ := json.Marshal(arg9)
	s9 := string(jsonarg9)

	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er := csr.AddDocumentHash(transactionContext, s)
	require.NoError(test, er)

	chaincodeStub.GetStateReturnsOnCall(0, nil, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, er, "Project doesn't exist")

	transactionContext, chaincodeStub = prepMocksAsCa()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, er, "only ngo can initiate addDocumentHash")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s1)
	require.EqualError(test, er, "Incorrect number of arguments. Expecting 7")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s2)
	require.EqualError(test, er, "project id must be a non-empty json string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s3)
	require.EqualError(test, er, "phase No. must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s4)
	require.EqualError(test, er, "criterion must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s5)
	require.EqualError(test, er, "doc hash must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s6)
	require.EqualError(test, er, "doc name must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s7)
	require.EqualError(test, er, "date must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s8)
	require.EqualError(test, er, "tx Id must be a non-empty string")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	_, er = csr.AddDocumentHash(transactionContext, s9)
	require.EqualError(test, er, "Invalid phase number!")

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes001, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err := csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, err, "Invalid project owner", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes01, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, err, "Documents cant be uploaded to a validated phase!", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes03, nil)
	chaincodeStub.GetStateReturnsOnCall(1, nil, nil)
	ex1, err = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, err, "No such criteria exists!", ex1)

	transactionContext, chaincodeStub = prepMocksAsNgo()
	transactionContext.GetStubReturns(chaincodeStub)
	chaincodeStub.GetStateReturnsOnCall(0, newProAsBytes, nil)
	chaincodeStub.GetStateReturnsOnCall(1, []byte("3456"), nil)
	ex1, err = csr.AddDocumentHash(transactionContext, s)
	require.EqualError(test, err, "tx id already exists", ex1)

}
