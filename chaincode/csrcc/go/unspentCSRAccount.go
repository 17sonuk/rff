package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
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
func (s *SmartContract) ReserveFundsForProject(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** ReserveFundsForProject Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		InfoLogger.Printf("only corporate can initiate ReserveFundsForProject")
		return false, fmt.Errorf("only corporate can initiate ReserveFundsForProject")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 5 {
		return false, fmt.Errorf("Incorrect no. of arguments. Expecting 5")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("projectId must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("qty must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("validity must be a non-empty string")
	}

	projectId := strings.ToLower(args[0])
	qty, err := strconv.ParseFloat(args[1], 64)
	if err != nil || qty <= 0.0 {
		return false, fmt.Errorf("Invalid amount!")
	}
	fromAddress := commonName
	ngoId := ""
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[3]

	validity, err := strconv.Atoi(args[4])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	projectState := Project{}

	//check if the project is present or not, if present populate ngo
	projectAsBytes, _ := ctx.GetStub().GetState(projectId)
	if projectAsBytes == nil {
		InfoLogger.Printf("No project with id:", projectId)
		return false, fmt.Errorf("No project with id: " + projectId)
	} else {
		json.Unmarshal(projectAsBytes, &projectState)
		ngoId = projectState.NGO
	}

	//check snapshot exists or not if yes take the quentity fron the snapshot
	snapshotBalance := 0.0
	snapshotExistsBytes, _ := ctx.GetStub().GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		return false, fmt.Errorf("Failed to get snapshot Exists: " + err.Error())
	}

	snapshotKey := fromAddress + "_snapshot"
	//get snapshot balance if present
	if string(snapshotExistsBytes) == "1" {

		//Get the balance in Snapshot for corporate
		snapShotBalanceInBytes, _ := ctx.GetStub().GetState(snapshotKey)
		if snapShotBalanceInBytes != nil {
			snapshotBalance, _ = strconv.ParseFloat(string(snapShotBalanceInBytes), 64)
		}
	}

	//get normal credit balance of the corpoate
	balance := 0.0
	getbalancebytes, _ := ctx.GetStub().GetState(fromAddress)
	if getbalancebytes != nil {
		balance, _ = strconv.ParseFloat(string(getbalancebytes), 64)
	}

	//compare the quantity required and deduct the necessary credits from normal balance or snapshot balance
	if (balance + snapshotBalance) < qty {
		InfoLogger.Printf("Maximum amount to redeem is:", balance+snapshotBalance, "and the requested amount is:", qty)
		return false, fmt.Errorf("requested quantity is more than the balance")
	}

	//reduce the equivalent amount from the snapshot and balance of corporate
	var flagSnapshot = false
	var snapshotTokenUsed = 0.0
	var tempqty = 0.0

	if snapshotBalance > 0.0 && snapshotBalance >= qty {
		flagSnapshot = true
		snapshotTokenUsed = qty
		balance := fmt.Sprintf("%0.2f", snapshotBalance-qty)
		ctx.GetStub().PutState(snapshotKey, []byte(balance))
	} else if snapshotBalance > 0.0 && snapshotBalance < qty {
		flagSnapshot = true
		snapshotTokenUsed = snapshotBalance
		ctx.GetStub().PutState(snapshotKey, []byte("0"))
		tempqty = qty - snapshotBalance
	}

	var normalBalanceFlag = false
	var normalBalanceUSed = 0.0

	if flagSnapshot == true {
		if tempqty == 0.0 {
			normalBalanceFlag = false
		} else {
			normalBalanceFlag = true
			normalBalanceUSed = tempqty
			remainingQty := balance - tempqty
			ctx.GetStub().PutState(fromAddress, []byte(fmt.Sprintf("%f", remainingQty)))
		}

	} else {
		normalBalanceFlag = true
		normalBalanceUSed = qty
		remainingQty := balance - qty
		ctx.GetStub().PutState(fromAddress, []byte(fmt.Sprintf("%f", remainingQty)))
	}

	reqiredCost := 0.0
	//calculate total project cost requirement
	for _, e := range projectState.Phases {
		reqiredCost += e.OutstandingQty
	}

	//total parking should not be greater than total project requirement
	if reqiredCost < qty {
		return false, fmt.Errorf("total parking shouldnot be greater than remaining project requirement")
	}

	accountKey := fromAddress + "_" + projectId
	existingAccountBytes, err := ctx.GetStub().GetState(accountKey)

	if err != nil {
		return false, fmt.Errorf("Failed to get account details: " + err.Error())
	}
	//TODO: set the timeperiod to 3 years
	newFund := FutureFunds{Qty: qty, Validity: validity}

	unspentCSRAccount := UnspentCSRAccount{}

	if existingAccountBytes != nil {
		err = json.Unmarshal(existingAccountBytes, &unspentCSRAccount)
		if err != nil {
			return false, fmt.Errorf(err.Error())
		}
		//total parking should not be greater than total project requirement
		totalpark := 0.0
		for _, e := range unspentCSRAccount.Funds {
			totalpark += e.Qty
		}

		if reqiredCost < totalpark+qty {
			return false, fmt.Errorf("total parking should not be greater than remaining project requirement")
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
	ctx.GetStub().PutState(accountKey, unspentCSRAccountASBytes)

	if normalBalanceFlag == true {
		err = createTransaction(ctx, fromAddress, ngoId, float64(normalBalanceUSed), date, "FundsToEscrowAccount", accountKey, txId, -1)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	if flagSnapshot == true {
		err = createTransaction(ctx, fromAddress, ngoId, float64(snapshotTokenUsed), date, "FundsToEscrowAccount_snapshot", accountKey, txId, -1)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	splitName := strings.SplitN(fromAddress, ".", -1)
	eventPayload := splitName[0] + " has reserved " + fmt.Sprintf("%0.2f", float64(qty)) + " credits for the project: " + projectState.ProjectName + "."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{ngoId}}
	notificationtAsBytes, err := json.Marshal(notification)
	ctx.GetStub().SetEvent("Notification", notificationtAsBytes)

	InfoLogger.Printf("*************** ReserveFundsForProject Successful ***************")
	return true, nil
}

//transfer the parked funds
func (s *SmartContract) ReleaseFundsForProject(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** ReleaseFundsForProject Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		InfoLogger.Printf("only corporate can initiate ReleaseFundsForProject")
		return false, fmt.Errorf("only corporate can initiate ReleaseFundsForProject")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 7 {
		return false, fmt.Errorf("Incorrect no. of arguments. Expecting 7")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("projectId must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("qty must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("rating must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("reviewMsg must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return false, fmt.Errorf("phaseNumber must be a non-empty string")
	}

	fromAddress := commonName
	toAddress := ""
	projectId := strings.ToLower(args[0])
	qty, err := strconv.ParseFloat(args[1], 64)
	if err != nil || qty <= 0.0 {
		return false, fmt.Errorf("Invalid amount!")
	}
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return false, fmt.Errorf("date should be numeric.")
	}
	txId := args[3]
	rating, err := strconv.Atoi(args[4])
	if err != nil || rating < 0.0 || rating > 5.0 {
		return false, fmt.Errorf("Invalid rating!")
	}
	reviewMsg := args[5]
	phaseNumber, err := strconv.Atoi(args[6])
	if err != nil || phaseNumber < 0.0 {
		return false, fmt.Errorf("Invalid phaseNumber!")
	}

	//if the project exists, populate ngo
	projectState := Project{}
	projectAsBytes, _ := ctx.GetStub().GetState(projectId)
	if projectAsBytes == nil {
		InfoLogger.Printf("No project with id:", projectId)
		return false, fmt.Errorf("No project with id: " + projectId)
	} else {
		json.Unmarshal(projectAsBytes, &projectState)
		toAddress = projectState.NGO

		//to add to the requested phase, previous phase has to be "fully funded" and current phase has to be "partially Funded" or "Created"
		if projectState.Phases[phaseNumber].PhaseState != "Open For Funding" && projectState.Phases[phaseNumber].PhaseState != "Partially Funded" {
			InfoLogger.Printf("projects with status Open For Funding or Partially Funded can only be funded")
			return false, fmt.Errorf("projects with status Open For Funding or Partially Funded can only be funded")
		}

		//add coresponding quantity to project phase
		if projectState.Phases[phaseNumber].OutstandingQty < qty {
			temp := fmt.Sprintf("%f", projectState.Phases[phaseNumber].OutstandingQty)
			InfoLogger.Printf("maximum amount remaining to donate to this project is:", temp)
			return false, fmt.Errorf("maximum amount remaining to donate to this project is: " + temp)
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
			return false, fmt.Errorf("Json convert error" + err.Error())
		}

		err = ctx.GetStub().PutState(projectId, updatedProjectAsBytes)
		if err != nil {
			return false, fmt.Errorf("error saving/updating project" + err.Error())
		}
	}

	accountKey := fromAddress + "_" + projectId
	existingAccountBytes, err := ctx.GetStub().GetState(accountKey)
	if err != nil {
		return false, fmt.Errorf("Failed to get account details: " + err.Error())
	}
	unspentCSRAccount := UnspentCSRAccount{}
	if existingAccountBytes == nil {
		InfoLogger.Printf("Account details are null for:", accountKey)
		return false, fmt.Errorf("Account details are null")
	} else {
		err = json.Unmarshal(existingAccountBytes, &unspentCSRAccount)
		if err != nil {
			return false, fmt.Errorf(err.Error())
		}

		InfoLogger.Printf("Fund to release:", qty)
		InfoLogger.Printf("acountKey:", accountKey)

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
			return false, fmt.Errorf("Amount being transferred is more than the amount parked")
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
		ctx.GetStub().PutState(accountKey, unspentCSRAccountAsBytes)

		// add to NGO balance
		balance := 0.0
		getbalancebytes, _ := ctx.GetStub().GetState(toAddress)
		if getbalancebytes != nil {
			balance, _ = strconv.ParseFloat(string(getbalancebytes), 64)
		}
		addQuantity := balance + qty
		ctx.GetStub().PutState(toAddress, []byte(fmt.Sprintf("%f", addQuantity)))

		err = createTransaction(ctx, fromAddress, toAddress, qty, date, "ReleaseFundsFromEscrow", accountKey, txId, phaseNumber)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}

		splitName := strings.SplitN(commonName, ".", -1)
		eventPayload := splitName[0] + " has released " + fmt.Sprintf("%0.2f", qty) + " credits for your project " + projectState.ProjectName + "."
		notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{toAddress}}
		notificationtAsBytes, _ := json.Marshal(notification)
		ctx.GetStub().SetEvent("Notification", notificationtAsBytes)

		InfoLogger.Printf("*************** ReleaseFundsForProject Successful ***************")
		return true, nil
	}
}
