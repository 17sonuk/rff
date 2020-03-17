package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

//corporate_project
type UnspentCSRAccount struct {
	ObjectType    string        `json:"docType"`
	Corporate     string        `json:"corporate"`
	Project       string        `json:"project"`
	NGO           string        `json:"ngo"`
	LeastValidity int           `json:"leastValidity"`
	Funds         []FutureFunds `json:"funds"`
}

type FutureFunds struct {
	Qty      float64 `json:"qty"`
	Validity int     `json:"validity"`
}

//park funds for the future phases of a project
func (s *SmartContract) reserveFundsForProject(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** ReserveFundsForProject Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		logger.Info("only corporate can initiate ReserveFundsForProject")
		return shim.Error("only corporate can initiate ReserveFundsForProject")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	projectId := strings.ToLower(args[0])
	qty, _ := strconv.ParseFloat(args[1], 64)
	if(qty <= 0.0) {
		return shim.Error("qty should be a positive no")
	}
	fromAddress := commonName
	ngoId := ""
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[3]

	validity, err := strconv.Atoi(args[4])
	if err != nil {
		return shim.Error(err.Error())
	}

	projectState := Project{}

	//check if the project is present or not, if present populate ngo
	projectAsBytes, _ := APIstub.GetState(projectId)
	if projectAsBytes == nil {
		logger.Info("No project with id:", projectId)
		return shim.Error("No project with id: " + projectId)
	} else {
		json.Unmarshal(projectAsBytes, &projectState)
		ngoId = projectState.NGO
	}

	//check snapshot exists or not if yes take the quentity fron the snapshot
	var snapshotBalance = 0.0
	snapshotExistsBytes, _ := APIstub.GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		return shim.Error("Failed to get snapshot Exists: " + err.Error())
	}

	var snapshotKey = fromAddress + "_snapshot"
	//get snapshot balance if present
	if string(snapshotExistsBytes) == "1" {
		
		//Get the balance in Snapshot for corporate
		snapShotBalanceInBytes, _ := APIstub.GetState(snapshotKey)
		if snapShotBalanceInBytes == nil {
			return shim.Error("Failed to get token balance from snapshot: " + err.Error())
		}

		snapshotBalance, _ = strconv.ParseFloat(string(snapShotBalanceInBytes), 64)
	}

	//get normal credit balance of the corpoate
	getbalancebytes, _ := APIstub.GetState(fromAddress)
	if getbalancebytes == nil {
		return shim.Error("error getting the balance of the Corporate")
	}
	balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)

	//compare the quantity required and deduct the necessary credits from normal balance or snapshot balance
	if (balance+snapshotBalance) < qty {
		logger.Info("Maximum amount to redeem is:", balance+snapshotBalance, "and the requested amount is:", qty)
		return shim.Error("requested quantity is more than the balance")
	}
	
	//reduce the equivalent amount from the snapshot and balance of corporate
	var flagSnapshot = false
	var snapshotTokenUsed = 0.0  
	var tempqty = 0.0

	if(snapshotBalance > 0.0 && snapshotBalance >= qty){
		flagSnapshot = true
		snapshotTokenUsed = qty
		balance := fmt.Sprintf("%0.2f", snapshotBalance-qty)
		APIstub.PutState(snapshotKey, []byte(balance))
	} else if (snapshotBalance > 0.0 && snapshotBalance < qty) {
		flagSnapshot = true
		snapshotTokenUsed = snapshotBalance
		APIstub.PutState(snapshotKey, []byte("0"))
		tempqty = qty-snapshotBalance
	} 

	var normalBalanceFlag = false
	var normalBalanceUSed = 0.0

	if(flagSnapshot==true){
		if(tempqty==0.0){
			normalBalanceFlag = false
		} else {
			normalBalanceFlag = true
			normalBalanceUSed = tempqty
			remainingQty := balance - tempqty
			APIstub.PutState(fromAddress, []byte(fmt.Sprintf("%f", remainingQty)))
		}
		
	} else {
		normalBalanceFlag = true
		normalBalanceUSed = qty
		remainingQty := balance - qty
		APIstub.PutState(fromAddress, []byte(fmt.Sprintf("%f", remainingQty)))
	}

	reqiredCost := 0.0
	//calculate total project cost requirement
	for _, e := range projectState.Phases {
		reqiredCost += e.OutstandingQty
	}

	//total parking should not be greater than total project requirement
	if reqiredCost < qty {
		return shim.Error("total parking shouldnot be greater than remaining project requirement")
	}

	accountKey := fromAddress + "_" + projectId
	existingAccountBytes, err := APIstub.GetState(accountKey)

	if err != nil {
		return shim.Error("Failed to get account details: " + err.Error())
	}
	//TODO: set the timeperiod to 3 years
	newFund := FutureFunds{Qty: qty, Validity: validity}

	unspentCSRAccount := UnspentCSRAccount{}

	if existingAccountBytes != nil {
		err = json.Unmarshal(existingAccountBytes, &unspentCSRAccount)
		if err != nil {
			return shim.Error(err.Error())
		}
		//total parking should not be greater than total project requirement
		totalpark := 0.0
		for _, e := range unspentCSRAccount.Funds {
			totalpark += e.Qty
		}

		if reqiredCost < totalpark+qty {
			return shim.Error("total parking should not be greater than remaining project requirement")
		}
		
		//if same project has multiple funds then append to the array
		flag := true

		for i, e := range unspentCSRAccount.Funds {
			fmt.Println("e value : ", e)
			if e.Validity == validity {
				e.Qty += qty
				unspentCSRAccount.Funds[i].Qty = e.Qty
				flag = false
				break
			}
		}

		if flag == true {
			unspentCSRAccount.Funds = append(unspentCSRAccount.Funds, newFund)
		}

		if len(unspentCSRAccount.Funds) > 0 {
			unspentCSRAccount.LeastValidity = unspentCSRAccount.Funds[0].Validity
		} else {
			unspentCSRAccount.LeastValidity = date
		}

	} else {
		funds := []FutureFunds{}
		funds = append(funds, newFund)

		//set least validity
		unspentCSRAccount = UnspentCSRAccount{ObjectType: "EscrowDetails", Corporate: fromAddress, Project: projectId, NGO: ngoId, LeastValidity: validity, Funds: funds}
	}
	unspentCSRAccountASBytes, _ := json.Marshal(unspentCSRAccount)
	APIstub.PutState(accountKey, unspentCSRAccountASBytes)

	if(normalBalanceFlag == true) {
		err = createTransaction(APIstub, fromAddress, accountKey, float64(normalBalanceUSed), date, "FundsToEscrowAccount", accountKey, txId, -1)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}
	}

	if(flagSnapshot == true){
		err = createTransaction(APIstub, fromAddress, accountKey, float64(snapshotTokenUsed), date, "FundsToEscrowAccount_snapshot", accountKey, txId, -1)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}
	}
	

	eventPayload := "Reserved " + fmt.Sprintf("%0.2f", float64(qty)) + " credits to project with id : " + projectId + "."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{ngoId}}
	notificationtAsBytes, err := json.Marshal(notification)
	APIstub.SetEvent("Notification", notificationtAsBytes)

	logger.Info("*************** ReserveFundsForProject Successful ***************")
	return shim.Success(nil)
}

//transfer the parked funds
func (s *SmartContract) releaseFundsForProject(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** ReleaseFundsForProject Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		logger.Info("only corporate can initiate ReleaseFundsForProject")
		return shim.Error("only corporate can initiate ReleaseFundsForProject")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	fromAddress := commonName
	toAddress := ""
	projectId := strings.ToLower(args[0])
	qty, err := strconv.ParseFloat(args[1], 64)
	if err != nil {
		return shim.Error("qty should be numeric.")
	}
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error("date should be numeric.")
	}
	txId := args[3]
	rating, err := strconv.Atoi(args[4])
	if err != nil {
		return shim.Error("rating is incorrect!")
	}
	reviewMsg := args[5]
	phaseNumber, err := strconv.Atoi(args[6])
	if err != nil {
		return shim.Error("phaseNumber should be numeric.")
	}

	//if the project exists, populate ngo
	projectState := Project{}
	projectAsBytes, _ := APIstub.GetState(projectId)
	if projectAsBytes == nil {
		logger.Info("No project with id:", projectId)
		return shim.Error("No project with id: " + projectId)
	} else {
		json.Unmarshal(projectAsBytes, &projectState)
		toAddress = projectState.NGO

		//to add to the requested phase, previous phase has to be "fully funded" and current phase has to be "partially Funded" or "Created"
		if projectState.Phases[phaseNumber].PhaseState != "Open For Funding" && projectState.Phases[phaseNumber].PhaseState != "Partially Funded" {
			logger.Info("projects with status Open For Funding or Partially Funded can only be funded")
			return shim.Error("projects with status Open For Funding or Partially Funded can only be funded")
		}

		//add coresponding quantity to project phase
		if projectState.Phases[phaseNumber].OutstandingQty < qty {
			temp := fmt.Sprintf("%f", projectState.Phases[phaseNumber].OutstandingQty)
			logger.Info("maximum amount remaining to donate to this project is:", temp)
			return shim.Error("maximum amount remaining to donate to this project is: " + temp)
		} else if projectState.Phases[phaseNumber].OutstandingQty == qty {
			qtyToTransfer := projectState.Phases[phaseNumber].OutstandingQty
			qty = qtyToTransfer
			projectState.Phases[phaseNumber].OutstandingQty = 0
			projectState.Phases[phaseNumber].PhaseState = "Fully Funded"
		} else {
			projectState.Phases[phaseNumber].OutstandingQty -= qty
			projectState.Phases[phaseNumber].PhaseState = "Partially Funded"
		}

		//update the phase contribution and contributors
		contributionObj := projectState.Phases[phaseNumber].Contributions[fromAddress]
		contributionObj.ReviewMsg = reviewMsg
		contributionObj.Rating = rating
		contributionObj.Contributor = fromAddress
		contributionObj.ContributionQty += qty
		projectState.Phases[phaseNumber].Contributions[fromAddress] = contributionObj
		projectState.Contributors[fromAddress] = "exists"

		//save the updated project
		updatedProjectAsBytes, err := json.Marshal(projectState)
		if err != nil {
			return shim.Error("Json convert error" + err.Error())
		}

		err = APIstub.PutState(projectId, updatedProjectAsBytes)
		if err != nil {
			return shim.Error("error saving/updating project" + err.Error())
		}
	}

	accountKey := fromAddress + "_" + projectId
	existingAccountBytes, err := APIstub.GetState(accountKey)
	if err != nil {
		return shim.Error("Failed to get account details: " + err.Error())
	}
	unspentCSRAccount := UnspentCSRAccount{}
	if existingAccountBytes == nil {
		logger.Info("Account details are null for:", accountKey)
		return shim.Error("Account details are null")
	} else {
		err = json.Unmarshal(existingAccountBytes, &unspentCSRAccount)
		if err != nil {
			return shim.Error(err.Error())
		}

		logger.Info("Fund to release:", qty)
		logger.Info("acountKey:", accountKey)

		fundToRelease := qty
		expiredEntry := 0
		entryToRemove := 0
		for i, funds := range unspentCSRAccount.Funds {
			if funds.Validity >= date {
				if funds.Qty > fundToRelease {
					unspentCSRAccount.Funds[i].Qty = funds.Qty - fundToRelease
					fundToRelease = 0
					break
				} else {
					unspentCSRAccount.Funds[i].Qty = 0
					fundToRelease -= funds.Qty
					entryToRemove += 1
				}
			} else {
				expiredEntry += 1
			}
		}
		if fundToRelease != 0 {
			return shim.Error("Amount being transferred is more than the amount parked")
		}
		if entryToRemove > 0 {
			copy(unspentCSRAccount.Funds[expiredEntry:], unspentCSRAccount.Funds[expiredEntry+entryToRemove:])
			unspentCSRAccount.Funds = unspentCSRAccount.Funds[:len(unspentCSRAccount.Funds)-entryToRemove]
		}
		if len(unspentCSRAccount.Funds) > 0 {
			unspentCSRAccount.LeastValidity = unspentCSRAccount.Funds[0].Validity
		} else {
			unspentCSRAccount.LeastValidity = date
		}

		unspentCSRAccountAsBytes, _ := json.Marshal(unspentCSRAccount)
		APIstub.PutState(accountKey, unspentCSRAccountAsBytes)

		// add to NGO balance
		getbalancebytes, _ := APIstub.GetState(toAddress)
		if getbalancebytes == nil {
			return shim.Error("error getting the balance of the ngo")
		}
		balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)
		addQuantity := balance + qty
		APIstub.PutState(toAddress, []byte(fmt.Sprintf("%f", addQuantity)))

		err = createTransaction(APIstub, fromAddress, toAddress, qty, date, "ReleaseFundsFromEscrow", accountKey, txId, phaseNumber)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}

		splitName := strings.SplitN(commonName, ".", -1)
		eventPayload := splitName[0] + " has released " + fmt.Sprintf("%0.2f", qty) + " credits for your project " + projectState.ProjectName + "."
		notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{toAddress}}
		notificationtAsBytes, _ := json.Marshal(notification)
		APIstub.SetEvent("Notification", notificationtAsBytes)

		logger.Info("*************** ReleaseFundsForProject Successful ***************")
		return shim.Success(nil)
	}
}

// func (s *SmartContract) TransferUnspentFundsToGovt(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
// 	//remove the funds from Escrow r
// 	if len(args) != 3 {
// 		return shim.Error("Incorrect number of arguments. Expecting 2")
// 	}else if len(args[0]) <= 0 {
// 		return shim.Error("1st argument must be a non-empty string")
// 	}else if len(args[1]) <= 0 {
// 		return shim.Error("2nd argument must be a non-empty string")
// 	}else if len(args[2]) <= 0 {
// 		return shim.Error("3rd argument must be a non-empty string")
// 	}
// 	toAddress := strings.ToLower(args[0]) // address of Gov
// 	date, err := strconv.Atoi(args[1])
// 	if err != nil {
// 		return shim.Error("date should be numeric.")
// 	}
// 	txId:=args[3]
// 	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"LeastValidity\":{\"$lt\":%d}}}",date)
// 	queryResultsAsBytes, err := getQueryResultForQueryString(APIstub, queryString)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}
// 	unspentCSRAccountArray := []UnspentCSRAccount{}
// 	if queryResultsAsBytes == nil {
// 		return shim.Error("No Organisation has expired funds")
// 	}else{
// 		err = json.Unmarshal(queryResultsAsBytes, &unspentCSRAccountArray)
// 		if err != nil {
// 			return shim.Error(err.Error())
// 		}
// 		expiredCredits := 0
// 		entryToRemove := 0
// 		for _, unspentCSRAccount := range unspentCSRAccountArray {
// 			expiredCredits = 0
// 			entryToRemove = 0
// 			for _, funds := range unspentCSRAccount.Funds {
// 				if funds.Validity>=date {
// 					unspentCSRAccount.LeastValidity = funds.Validity
// 					break
// 				}else{
// 					expiredCredits += funds.Qty
// 					entryToRemove += 1
// 				}
// 			}
// 			createTransaction(APIstub, unspentCSRAccount.Corporate, toAddress, expiredCredits, date, "FundsToGov",txId)
// 			if entryToRemove>0 {
// 				accountKey := unspentCSRAccount.Corporate + "_" + unspentCSRAccount.Project
// 				unspentCSRAccount.Funds = unspentCSRAccount.Funds[entryToRemove:]
// 				unspentCSRAccountASBytes, _ := json.Marshal(unspentCSRAccount)
// 				APIstub.PutState(accountKey, unspentCSRAccountASBytes)
// 			}
// 		}
// 		return shim.Success(nil)
// 	}
// }
