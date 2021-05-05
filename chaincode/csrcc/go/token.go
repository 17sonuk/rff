package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type TokenRequest struct {
	ObjectType   string  `json:"docType"`
	From         string  `json:"from"`
	Qty          float64 `json:"qty"`
	Role         string  `json:"role"`
	Status       string  `json:"status"` //Requested,Assigned,Rejected
	BankTxId     string  `json:"bankTxId"`
	Date         int     `json:"date"`
	Comments     string  `json:"comments"`
	ProofDocName string  `json:"proofDocName"`
	ProofDocHash string  `json:"proofDocHash"`
}

// CreateCar adds a new car to the world state with given details
func (s *SmartContract) RequestTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** requestTokens Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		InfoLogger.Printf("only corporate can initiate requestTokens")
		return false, fmt.Errorf("only corporate can initiate requestTokens")
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
		return false, fmt.Errorf("Qty must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("role must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("bank tx id must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("doc name must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("doc hash must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return false, fmt.Errorf("txid must be a non-empty string")
	}

	//from,qty,role,txid
	tokenQty, err := strconv.ParseFloat(args[0], 64)
	if err != nil || tokenQty <= 0.0 {
		return false, fmt.Errorf("Invalid amount!")
	}

	fromAddress := commonName
	toAddress := "ca.creditsauthority.csr.com"
	callerRole := strings.ToLower(args[1])
	bankTxId := args[2]
	proofDocName := args[3]
	proofDocHash := args[4]
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return false, fmt.Errorf("Error converting date " + err.Error())
	}
	txId := args[6]
	tokenRequestAsBytes := []byte{}

	oldTokenRequestAsBytes, _ := ctx.GetStub().GetState(bankTxId)
	if oldTokenRequestAsBytes != nil {
		return false, fmt.Errorf("Token request with this ID already exists")
		//Update existing token with Requested status
		// tokenRequest := TokenRequest{}
		// err = json.Unmarshal(oldTokenRequestAsBytes, &tokenRequest)
		// if tokenRequest.Status != "Rejected" {
		// 	return false, fmt.Errorf("Token request with this ID already exists with " + tokenRequest.Status + " status")
		// }
	}

	newReq := &TokenRequest{
		ObjectType:   "TokenRequest",
		From:         fromAddress,
		Qty:          tokenQty,
		Role:         callerRole,
		Status:       "Requested",
		Date:         date,
		BankTxId:     bankTxId,
		ProofDocName: proofDocName,
		ProofDocHash: proofDocHash,
	}
	tokenRequestAsBytes, err = json.Marshal(newReq)

	//save the request to ledger, key is args[4] i.e. bankTxId
	ctx.GetStub().PutState(bankTxId, tokenRequestAsBytes)

	//Save Corporates if not already saved
	//TODO: See if this can be filled and updated at registration time instead of on every token request
	if callerRole == "corporate.csr.com" {

		corporates := getCorporates(ctx)

		if len(corporates) == 0 || !contains(corporates, fromAddress) {
			corporates = append(corporates, fromAddress)
			corporatesInBytes, _ := json.Marshal(corporates)
			ctx.GetStub().PutState("corporates", corporatesInBytes)
		}
	}

	err = createTransaction(ctx, fromAddress, toAddress, tokenQty, date, "TokenRequest", bankTxId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", tokenQty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{toAddress}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	return true, nil
}

//CA assigns tokens to the corporates/citizens
func (s *SmartContract) AssignTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** assignTokens Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can initiate assignTokens")
		return false, fmt.Errorf("only creditsauthority can initiate assignTokens")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 3 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("bank tx id must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	bankTxId := args[0]
	date, err := strconv.Atoi(args[1])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[2]

	tokenRequestAsBytes, _ := ctx.GetStub().GetState(bankTxId)
	if tokenRequestAsBytes == nil {
		return false, fmt.Errorf("No such token request exists")
	}

	tokenRequest := TokenRequest{}
	err = json.Unmarshal(tokenRequestAsBytes, &tokenRequest)
	if err != nil {
		return false, fmt.Errorf("error in unmarshalling: " + err.Error())
	}

	//validity check so that approved TokenRequest are not served twice and rejected TokenRequest is not assigned
	if tokenRequest.Status == "Assigned" {
		InfoLogger.Printf("TokenRequest with id:", bankTxId, "is already approved")
		return false, fmt.Errorf("TokenRequest with id: " + bankTxId + " is already approved")
	} else if tokenRequest.Status == "Rejected" {
		InfoLogger.Printf("Rejected TokenRequest cannot be Assigned")
		return false, fmt.Errorf("Rejected TokenRequest cannot be Assigned")
	}

	tokenBalanceAsBytes, _ := ctx.GetStub().GetState(tokenRequest.From)
	if tokenBalanceAsBytes == nil {
		ctx.GetStub().PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", tokenRequest.Qty)))
	} else {
		balance, _ := strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
		ctx.GetStub().PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", balance+tokenRequest.Qty)))
	}

	tokenRequest.Status = "Assigned"
	tokenReqBytes, err := json.Marshal(tokenRequest)
	if err != nil {
		return false, fmt.Errorf("Marshal error")
	}
	ctx.GetStub().PutState(bankTxId, tokenReqBytes)

	//TODO: verify the CSR address
	err = createTransaction(ctx, "ca.creditsauthority.csr.com", tokenRequest.From, tokenRequest.Qty, date, "AssignToken", bankTxId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	eventPayload := "You are assigned  " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** assignTokens Successfull ***************")

	return true, nil
}

//reject the token request
func (s *SmartContract) RejectTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** rejectTokens Started ***************")
	InfoLogger.Printf("args received:", arg)

	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can initiate rejectTokens")
		return false, fmt.Errorf("only creditsauthority can initiate rejectTokens")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 4 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 4")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("bankTxId must be non-empty")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("comments must be non-empty")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be non-empty")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("tx Id must be non-empty")
	}

	bankTxId := args[0]
	comments := args[1]
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[3]

	//fetch Tokenrequest by bankTx id, unmarshal to Token request, change the status field to Rejected
	tokenRequestAsBytes, _ := ctx.GetStub().GetState(bankTxId)
	if tokenRequestAsBytes == nil {
		return false, fmt.Errorf("No such TokenRequest exists")
	}

	tokenRequest := TokenRequest{}
	json.Unmarshal(tokenRequestAsBytes, &tokenRequest)

	if tokenRequest.Status == "Requested" {
		tokenRequest.Status = "Rejected"
		tokenRequest.Comments = comments
	} else {
		return false, fmt.Errorf("Invalid status, TokenRequest's Status should be Requested")
	}

	tokenRequestAsBytes, _ = json.Marshal(tokenRequest)
	ctx.GetStub().PutState(bankTxId, tokenRequestAsBytes)

	err = createTransaction(ctx, "Admin@creditsauthority.csr.com", tokenRequest.From, tokenRequest.Qty, date, "TokenReject", bankTxId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has rejected your request of " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** rejectTokens Successfull ***************")
	return true, nil
}

//transfer tokens from corporate to ngo
func (s *SmartContract) TransferTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** transferTokens Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		InfoLogger.Printf("only corporate can initiate transferTokens")
		return false, fmt.Errorf("only corporate can initiate transferTokens")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 8 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 8")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("1st argument must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("2nd argument must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("3rd argument must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("4th argument must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("5th argument must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("6th argument must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return false, fmt.Errorf("7th argument must be a non-empty string")
	} else if len(args[7]) <= 0 {
		return false, fmt.Errorf("8th argument must be a non-empty string")
	}

	var flagSnapshot = false
	var snapshotTokenUsed = 0.0

	//donated amount
	qty, err := strconv.ParseFloat(args[0], 64)
	if err != nil || qty <= 0.0 {
		return false, fmt.Errorf("Invalid Amount!")
	}

	qtyToTransfer := qty

	pId := args[1]
	fromAddress := commonName
	phaseNumber, err := strconv.Atoi(args[2])
	if err != nil || phaseNumber < 0.0 {
		return false, fmt.Errorf("Invalid phase Number!")
	}

	reviewMsg := args[3]
	rating, err := strconv.Atoi(args[4])
	if err != nil || rating < 0.0 || rating > 5.0 {
		return false, fmt.Errorf("Invalid rating")
	}
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return false, fmt.Errorf("date is not an integer! " + err.Error())
	}
	txId1 := args[6]
	txId2 := args[7]

	//Get existing project
	projectAsBytes, _ := ctx.GetStub().GetState(pId)
	if projectAsBytes == nil {
		return false, fmt.Errorf("No such project exists!")
	}
	projectObj := Project{}
	err = json.Unmarshal(projectAsBytes, &projectObj)
	if err != nil {
		return false, fmt.Errorf("error in unmarshalling project: " + err.Error())
	}
	InfoLogger.Printf("A project found...")

	//to be used during actual run.
	if projectObj.Phases[phaseNumber].PhaseState == "Open For Funding" || projectObj.Phases[phaseNumber].PhaseState == "Partially Funded" {
		InfoLogger.Printf("FUNDING IS ALLOWED...")
		if projectObj.Phases[phaseNumber].OutstandingQty <= qty {
			qtyToTransfer = projectObj.Phases[phaseNumber].OutstandingQty
			qty = qtyToTransfer
			projectObj.Phases[phaseNumber].OutstandingQty = 0
			projectObj.Phases[phaseNumber].PhaseState = "Fully Funded"
			if phaseNumber == len(projectObj.Phases)-1 {
				projectObj.ProjectState = "Fully Funded"
			} else {
				projectObj.ProjectState = "Partially Funded"
			}
		} else {
			projectObj.Phases[phaseNumber].OutstandingQty -= qty
			projectObj.Phases[phaseNumber].PhaseState = "Partially Funded"
			projectObj.ProjectState = "Partially Funded"
		}
	} else {
		InfoLogger.Printf("FUNDING NOT ALLOWED...")
		return false, fmt.Errorf("Funding is not allowed to this phase!")
	}

	//update the phase contribution and contributors
	contributionObj := projectObj.Phases[phaseNumber].Contributions[fromAddress]
	contributionObj.ReviewMsg = reviewMsg
	contributionObj.Rating = rating
	contributionObj.Contributor = fromAddress
	contributionObj.ContributionQty += qty
	projectObj.Phases[phaseNumber].Contributions[fromAddress] = contributionObj
	projectObj.Contributors[fromAddress] = "exists"

	//save the updated project
	updatedProjectAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return false, fmt.Errorf("Json convert error " + err.Error())
	}

	err = ctx.GetStub().PutState(pId, updatedProjectAsBytes)
	if err != nil {
		return false, fmt.Errorf("error saving/updating project " + err.Error())
	}
	InfoLogger.Printf("PROJECT UPDATED...")

	snapshotExistsBytes, _ := ctx.GetStub().GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		InfoLogger.Printf("SNAPSHOT EXISTS: nil...")
		return false, fmt.Errorf("Failed to get snapshot Exists: " + err.Error())
	}

	//check if there is a snapshot (flag = true) and if there are any funds in snapshot
	if string(snapshotExistsBytes) == "1" {
		InfoLogger.Printf("SNAPSHOT = 1...")
		snapshotKey := fromAddress + "_snapshot"

		snapshotBalance := 0.0

		//Get the balance in Snapshot for corporate
		snapShotBalanceInBytes, _ := ctx.GetStub().GetState(snapshotKey)
		if snapShotBalanceInBytes != nil {
			snapshotBalance, _ = strconv.ParseFloat(string(snapShotBalanceInBytes), 64)
			InfoLogger.Printf("SNAPSHOT BALANCE = ", snapshotBalance)
		}

		if snapshotBalance > 0.0 {
			flagSnapshot = true
			if snapshotBalance >= qty {
				//use the snapshot funds and then use the current fund
				balance := fmt.Sprintf("%0.2f", snapshotBalance-qty)

				//take account of how much snapshot account is used to create transaction
				snapshotTokenUsed = qty
				InfoLogger.Printf("SNAPSHOT IS MORE THAN QTY...", qty)
				ctx.GetStub().PutState(snapshotKey, []byte(balance))
				qty = 0.0
			} else {
				qty -= snapshotBalance

				//take account of how much snapshot account is used to create transaction
				snapshotTokenUsed = snapshotBalance
				InfoLogger.Printf("SNAPSHOT IS LESS THAN QTY...", snapshotBalance)
				ctx.GetStub().PutState(snapshotKey, []byte("0.0"))
			}
		}
	}

	//if qty is still remaining, use the current account
	if qty > 0.0 {
		//reduce token balance from sender
		InfoLogger.Printf("QTY LEFT AFTER DEDUCTING SNAPSHOT BALANCE = ", qty)
		tokenBalanceInBytes, _ := ctx.GetStub().GetState(fromAddress)
		if tokenBalanceInBytes == nil {
			return false, fmt.Errorf("Failed to get token balance to transfer!")
		}
		tokenBalance, _ := strconv.ParseFloat(string(tokenBalanceInBytes), 64)

		if tokenBalance >= qty {
			InfoLogger.Printf("BALANCE IS SUFFICIENT...")
			finalQty := fmt.Sprintf("%0.2f", tokenBalance-qty)
			ctx.GetStub().PutState(fromAddress, []byte(finalQty))
		} else {
			InfoLogger.Printf("INSUFFICIENT BALANCE...")
			return false, fmt.Errorf("Not enough balance " + fromAddress + ".Available balance:" + string(tokenBalanceInBytes))
		}
	}

	//Add token balance to receiver
	receiverTokenBalanceAsBytes, _ := ctx.GetStub().GetState(projectObj.NGO)
	receiverTokenBalance := 0.0
	if receiverTokenBalanceAsBytes != nil {
		receiverTokenBalance, _ = strconv.ParseFloat(string(receiverTokenBalanceAsBytes), 64)
	}

	receiverFinalBal := fmt.Sprintf("%0.2f", receiverTokenBalance+qtyToTransfer)
	ctx.GetStub().PutState(projectObj.NGO, []byte(receiverFinalBal))

	if qty > 0.0 {
		err = createTransaction(ctx, fromAddress, projectObj.NGO, qty, date, "TransferToken", pId, txId1, phaseNumber)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	if flagSnapshot == true {
		err = createTransaction(ctx, fromAddress, projectObj.NGO, snapshotTokenUsed, date, "TransferToken_snapshot", pId, txId2, phaseNumber)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has transferred " + fmt.Sprintf("%0.2f", qtyToTransfer) + " credits to your project " + projectObj.ProjectName + "."
	notification := &Notification{TxId: txId1, Description: eventPayload, Users: []string{projectObj.NGO}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** transferTokens Successfull ***************")
	return true, nil
}

//At the start of every financial year - Jan1
func (s *SmartContract) SnapshotCurrentCorporateBalances(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** snapshotCurrentCorporateBalances Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can initiate snapshotCurrentCorporateBalances")
		return false, fmt.Errorf("only creditsauthority can initiate snapshotCurrentCorporateBalances")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 2 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	date, err := strconv.Atoi(args[0])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[1]

	corporates := getCorporates(ctx)
	balancesExist := false
	objRef := ""
	sum := 0.0

	notificationUsers := make([]string, len(corporates))

	//loop through each corporate and create new corporate address and copy non zero balances into corporateAddress_snapshot
	for _, corporate := range corporates {
		qtyBytes, _ := ctx.GetStub().GetState(corporate)
		tokenBalance := 0.0
		if qtyBytes != nil {
			tokenBalance, _ = strconv.ParseFloat(string(qtyBytes), 64)
		}

		if tokenBalance > 0.0 {
			notificationUsers = append(notificationUsers, corporate)
			balancesExist = true
			sum += tokenBalance
			//create a new entry with corporate_snapshot and save his balance or,
			//add token balance to existing snapshot balance.
			snapBalance := 0.0
			snapBalanceInBytes, _ := ctx.GetStub().GetState(corporate + "_snapshot")
			if snapBalanceInBytes != nil {
				snapBalance, _ = strconv.ParseFloat(string(snapBalanceInBytes), 64)
			}

			ctx.GetStub().PutState(corporate+"_snapshot", []byte(fmt.Sprintf("%0.2f", snapBalance+tokenBalance)))
			//reset the original token balance to 0
			ctx.GetStub().PutState(corporate, []byte("0.0"))
			objRef += corporate + ":" + fmt.Sprintf("%0.2f", tokenBalance) + ","
		}
	}

	if balancesExist == true {
		ctx.GetStub().PutState("snapshot_exists", []byte("1"))
		objRef = strings.Trim(objRef, ",")
		err = createTransaction(ctx, commonName, "AllCorporates", sum, date, "BalanceSnapshot", objRef, txId, -1)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	eventPayload := "A Snapshot of your credits is created. Use them within 30 days."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: notificationUsers}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** snapshotCurrentCorporateBalances Successful ***************")
	return true, nil
}

//At the end of 1 year+30 days, the Flag has to be set to false and the balances are to be made 0 for corporates. Fire event TransfertoGovt Qty, From,For the year
func (s *SmartContract) TransferUnspentTokensToGovt(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** transferUnspentTokensToGovt Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can initiate transferUnspentTokensToGovt")
		return false, fmt.Errorf("only creditsauthority can initiate transferUnspentTokensToGovt")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 3 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("govt address must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	//govt address
	govtAddress := args[0] + ".creditsauthority.csr.com"
	csrAddress := commonName
	date, err := strconv.Atoi(args[1])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[2]

	//check if snapshots exists
	snapshotExistsBytes, _ := ctx.GetStub().GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		return false, fmt.Errorf("Failed to get snapshot Exists: " + err.Error())
	}

	corporates := getCorporates(ctx)
	qtyBytes := []byte{}
	tokenBalance := 0.0
	escrowBalance := 0.0
	sum := 0.0
	objRef := ""

	notificationUsers := make([]string, len(corporates))

	//sum and clear the snapshot balances and transfer tokens to Govt address
	for _, corporate := range corporates {
		qtyBytes, _ = ctx.GetStub().GetState(corporate + "_snapshot")
		tokenBalance = 0.0
		escrowBalance = 0.0
		if qtyBytes != nil {
			tokenBalance, _ = strconv.ParseFloat(string(qtyBytes), 64)
			if tokenBalance > 0.0 {
				notificationUsers = append(notificationUsers, corporate)
				InfoLogger.Printf("token balance:", tokenBalance)
				//set snapshot balance to 0
				ctx.GetStub().PutState(corporate+"_snapshot", []byte(string("0")))
				objRef += corporate + ":normal:" + fmt.Sprintf("%0.2f", tokenBalance) + ","
			}
		}

		//remove expired escrow balances of the coporate
		//get all locked obj of a corporate
		queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"corporate\": \"%s\"}, \"fields\": [\"_id\"]}", corporate)
		queryResults, err := GetQueryResultForQueryString(ctx, queryString)
		if err != nil {
			return false, fmt.Errorf(err.Error())
		}
		InfoLogger.Printf("query result:", string(queryResults))

		var listOfIds []map[string]string
		err = json.Unmarshal([]byte(queryResults), &listOfIds)
		//InfoLogger.Printf(listOfIds)

		// loop through each project where credits are locked.
		for _, value := range listOfIds {
			escrowObj := UnspentCSRAccount{}
			escrowAsBytes, _ := ctx.GetStub().GetState(value["Key"])
			err = json.Unmarshal(escrowAsBytes, &escrowObj)

			tmpFunds := make([]FutureFunds, 0, len(escrowObj.Funds))

			//for each fund, remove the fund if fund=leastValidity and current date is beyond least validity
			for _, v := range escrowObj.Funds {
				if escrowObj.LeastValidity < date && v.Validity == escrowObj.LeastValidity {
					escrowBalance += v.Qty
				} else {
					tmpFunds = append(tmpFunds, v)
				}
			}
			InfoLogger.Printf("TmpFunds: ", tmpFunds)
			escrowObj.Funds = tmpFunds
			//if funds still exist, make leastValidity = validity of the 1st fund.
			if len(tmpFunds) != 0 {
				escrowObj.LeastValidity = tmpFunds[0].Validity
			}

			//marshal the updated escrow and save it.
			marshalEscrow, err := json.Marshal(escrowObj)
			if err != nil {
				return false, fmt.Errorf(err.Error())
			}
			ctx.GetStub().PutState(value["Key"], marshalEscrow)
		}
		if escrowBalance > 0.0 {
			objRef += corporate + ":escrow:" + fmt.Sprintf("%0.2f", escrowBalance) + ","
		}

		sum += tokenBalance + escrowBalance
	}
	objRef = strings.Trim(objRef, ",")
	InfoLogger.Printf("obj Ref:", objRef)
	if sum == 0.0 {
		return false, fmt.Errorf("No unspent tokens exist!")
	}

	//Add tokens to Govt/do an update
	govtBalance := 0.0
	govtBalanceInBytes, _ := ctx.GetStub().GetState(govtAddress)
	if govtBalanceInBytes != nil {
		govtBalance, _ = strconv.ParseFloat(string(govtBalanceInBytes), 64)
	}

	ctx.GetStub().PutState(govtAddress, []byte(fmt.Sprintf("%0.2f", govtBalance+sum)))
	ctx.GetStub().PutState("snapshot_exists", []byte("0"))

	err = createTransaction(ctx, csrAddress, govtAddress, sum, date, "ClosingYearFundTransfer", objRef, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	eventPayload := "Your unspent credits are transferred to Government."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: notificationUsers}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** transferUnspentTokensToGovt Successful ***************")
	return true, nil
}

//query for all token request
func (s *SmartContract) QueryForAllTokenRequests(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	InfoLogger.Printf("*************** queryForAllTokenRequests Started ***************")

	queryString := ""

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return nil, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)

	if mspId == "CorporateMSP" {
		queryString = gqs([]string{"docType", "TokenRequest", "from", commonName})
	} else if mspId == "CreditsAuthorityMSP" {
		queryString = gqs([]string{"docType", "TokenRequest"})
	} else if mspId == "NgoMsp" {
		return nil, fmt.Errorf("request token is not valid for Ngo")
	} else {
		InfoLogger.Printf("Invalid request")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)
	InfoLogger.Printf("QueryString", queryString)

	queryResults, err := GetQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, fmt.Errorf(err.Error())
	}

	InfoLogger.Printf("*************** queryForAllTokenRequests Successful ***************")
	return queryResults, nil
}
