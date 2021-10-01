package main

import (
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type TokenRequest struct {
	ObjectType string  `json:"docType"`
	From       string  `json:"from"`
	Qty        float64 `json:"qty"`
	Status     string  `json:"status"` //Requested,Assigned,Rejected
	Date       int     `json:"date"`
	Comments   string  `json:"comments"`
	PaymentId  string  `json:"paymentId"`
}

//Corporate = Donor
//CreditsAuthority = Rainforest
func (s *SmartContract) RequestTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(ctx, creator)
	fmt.Println("client id: " + commonName + " mspID: " + mspId)
	if mspId != CorporateMSP {
		return false, fmt.Errorf("only corporate can initiate requestTokens")
	}

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 6 {
		return false, fmt.Errorf("Incorrect no. of arguments. Expecting 6")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("Qty must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("payment id must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("payment status must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("txid must be a non-empty string")
	}

	//from,qty,role,txid
	tokenQty, err := strconv.ParseFloat(args[0], 64)
	if err != nil || tokenQty <= 0.0 {
		return false, fmt.Errorf("Invalid amount!")
	}

	fromAddress := commonName
	toAddress := "ca." + creditsauthority + "." + domain
	bankTxId := args[1]
	paymentStatus := args[2]
	comments := args[3]
	date, err := strconv.Atoi(args[4])
	if err != nil {
		return false, fmt.Errorf("Error converting date " + err.Error())
	}
	txId := args[5]

	oldTokenRequestAsBytes, _ := ctx.GetStub().GetState(bankTxId)
	if oldTokenRequestAsBytes != nil {
		return false, fmt.Errorf("Fund request with this ID already exists")
	}

	newReq := &TokenRequest{
		ObjectType: "TokenRequest",
		From:       fromAddress,
		Qty:        tokenQty,
		Status:     "Requested",
		Date:       date,
		PaymentId:  bankTxId,
		Comments:   comments,
	}

	if paymentStatus == "COMPLETED" {
		//give the funds directly
		newReq.Status = "Assigned"
	}

	tokenRequestAsBytes, err := json.Marshal(newReq)
	//save the token request to ledger, key is bankTxId
	ctx.GetStub().PutState(bankTxId, tokenRequestAsBytes)

	//Save Corporates if not already saved
	//TODO: See if this can be filled and updated at registration time instead of on every token request
	corporates := getCorporates(ctx)

	if len(corporates) == 0 || !contains(corporates, fromAddress) {
		corporates = append(corporates, fromAddress)
		corporatesInBytes, _ := json.Marshal(corporates)
		ctx.GetStub().PutState("corporates", corporatesInBytes)
	}

	txType := "TokenRequest"
	if paymentStatus == "COMPLETED" {
		txType = "AssignToken"
		//credit the funds to the donor's wallet  // to discuss **
		tokenBalanceAsBytes, _ := ctx.GetStub().GetState(commonName)
		if tokenBalanceAsBytes == nil {
			ctx.GetStub().PutState(commonName, []byte(fmt.Sprintf("%0.2f", tokenQty)))
		} else {
			balance, _ := strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
			ctx.GetStub().PutState(commonName, []byte(fmt.Sprintf("%0.2f", math.Round((balance+tokenQty)*100)/100)))
		}
		//save a transaction
		err = createTransaction(ctx, toAddress, fromAddress, tokenQty, date, txType, bankTxId, txId, -1)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	} else {
		//save a transaction
		err = createTransaction(ctx, fromAddress, toAddress, tokenQty, date, txType, bankTxId, txId, -1)
		if err != nil {
			return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
		}
	}

	//emit chaincode event for notification  // to discuss **
	if paymentStatus == "PENDING" {
		splitName := strings.SplitN(commonName, ".", -1)
		eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", tokenQty) + " credits."
		notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{toAddress}}
		notificationtAsBytes, _ := json.Marshal(notification)
		eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
		if eventErr != nil {
			return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
		}
	}
	return true, nil
}

//CA assigns tokens to the corporate
func (s *SmartContract) AssignTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, _, _ := getTxCreatorInfo(ctx, creator)
	if mspId != CreditsAuthorityMSP {
		return false, fmt.Errorf("only creditsauthority can initiate assignTokens")
	}

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
	if tokenRequest.Status != "Requested" {
		return false, fmt.Errorf("TokenRequest with id: " + bankTxId + " is already " + tokenRequest.Status)
	}

	//credit funds in donor's wallet // to discuss **
	tokenBalanceAsBytes, _ := ctx.GetStub().GetState(tokenRequest.From)
	if tokenBalanceAsBytes == nil {
		ctx.GetStub().PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", tokenRequest.Qty)))
	} else {
		balance, _ := strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
		ctx.GetStub().PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", math.Round((balance+tokenRequest.Qty)*100)/100)))
	}

	//update the status of token request
	tokenRequest.Status = "Assigned"
	tokenReqBytes, err := json.Marshal(tokenRequest)
	if err != nil {
		return false, fmt.Errorf("Marshal error")
	}
	ctx.GetStub().PutState(bankTxId, tokenReqBytes)

	//save a transaction
	err = createTransaction(ctx, "ca."+creditsauthority+"."+domain, tokenRequest.From, tokenRequest.Qty, date, "AssignToken", bankTxId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	eventPayload := "You are assigned " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " funds."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	return true, nil
}

//reject the token request
func (s *SmartContract) RejectTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {

	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(ctx, creator)
	if mspId != CreditsAuthorityMSP {
		return false, fmt.Errorf("only creditsauthority can initiate rejectTokens")
	}

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

	err = createTransaction(ctx, "ca."+creditsauthority+"."+domain, tokenRequest.From, tokenRequest.Qty, date, "TokenReject", bankTxId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has rejected your request of " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " funds."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	return true, nil
}

//transfer tokens from corporate to ngo
func (s *SmartContract) TransferTokens(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {

	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(ctx, creator)

	if mspId != CorporateMSP {
		return false, fmt.Errorf("only corporate can initiate transferTokens")
	}

	var args []string
	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 7 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 5")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("amount must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("project id must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("payment id id must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return false, fmt.Errorf("payment Mode id must be a non-empty string")
	}

	//donated amount
	qty, err := strconv.ParseFloat(args[0], 64)
	if err != nil || qty <= 0.0 {
		return false, fmt.Errorf("Invalid Amount!")
	}

	qtyToTransfer := qty

	pId := args[1]
	fromAddress := commonName

	notes := args[2]
	date, err := strconv.Atoi(args[3])
	if err != nil {
		return false, fmt.Errorf("date is not an integer! " + err.Error())
	}
	txId1 := args[4]
	paymentId := args[5]
	paymentMode := args[6]

	//fetch the project
	projectAsBytes, _ := ctx.GetStub().GetState(pId)
	if projectAsBytes == nil {
		return false, fmt.Errorf("No such project exists!")
	}
	projectObj := Project{}
	err = json.Unmarshal(projectAsBytes, &projectObj)
	if err != nil {
		return false, fmt.Errorf("error in unmarshalling project: " + err.Error())
	}

	phaseNumber := -1
	for i := 0; i < len(projectObj.Phases); i++ {
		if projectObj.Phases[i].PhaseState == "Open For Funding" || projectObj.Phases[i].PhaseState == "Partially Funded" {
			phaseNumber = i
			break
		}
	}

	if phaseNumber == -1 {
		//add amount in project balance
		projectObj.Balance = math.Round((projectObj.Balance+qty)*100) / 100
	} else {
		if projectObj.Phases[phaseNumber].OutstandingQty > qty {
			projectObj.Phases[phaseNumber].OutstandingQty = math.Round((projectObj.Phases[phaseNumber].OutstandingQty-qty)*100) / 100
			projectObj.Phases[phaseNumber].PhaseState = "Partially Funded"
		} else if projectObj.Phases[phaseNumber].OutstandingQty == qty {
			projectObj.Phases[phaseNumber].OutstandingQty = math.Round((projectObj.Phases[phaseNumber].OutstandingQty-qty)*100) / 100
			projectObj.Phases[phaseNumber].PhaseState = "Fully Funded"
		} else {
			projectObj.Balance = math.Round((qty-projectObj.Phases[phaseNumber].OutstandingQty)*100) / 100
			projectObj.Phases[phaseNumber].OutstandingQty = 0.0
			projectObj.Phases[phaseNumber].PhaseState = "Fully Funded"
		}
	}

	projectObj.TotalReceived = math.Round((projectObj.TotalReceived+qty)*100) / 100
	if projectObj.TotalReceived < projectObj.TotalProjectCost {
		projectObj.ProjectState = "Partially Funded"
	} else {
		projectObj.ProjectState = "Fully Funded"
	}

	//update the phase contribution and contributors
	contributionObj := projectObj.Contributions[fromAddress]
	contributionObj.Contributor = fromAddress
	contributionObj.ContributionQty = math.Round((contributionObj.ContributionQty+qty)*100) / 100
	projectObj.Contributions[fromAddress] = contributionObj
	projectObj.Contributors[fromAddress] = "exists"

	//save the updated project
	updatedProjectAsBytes, _ := json.Marshal(projectObj)

	err = ctx.GetStub().PutState(pId, updatedProjectAsBytes)
	if err != nil {
		return false, fmt.Errorf("error saving/updating project " + err.Error())
	}

	// if commonName != guest+"."+corporate+"."+domain {
	// 	//if qty is still remaining, use the current account
	// 	if qty > 0.0 {
	// 		//reduce token balance from sender
	// 		tokenBalanceInBytes, _ := ctx.GetStub().GetState(fromAddress)
	// 		tokenBalance := 0.0
	// 		if tokenBalanceInBytes != nil {
	// 			fmt.Println(strconv.ParseFloat(string(tokenBalanceInBytes), 64))
	// 			tokenBalance, _ = strconv.ParseFloat(string(tokenBalanceInBytes), 64)
	// 		}
	// 		fmt.Println("test balance")
	// 		fmt.Println(tokenBalance)

	// 		if tokenBalance >= qty {
	// 			finalQty := fmt.Sprintf("%0.2f", math.Round((tokenBalance-qty)*100)/100)
	// 			ctx.GetStub().PutState(fromAddress, []byte(finalQty))
	// 		} else {
	// 			return false, fmt.Errorf("Not enough balance. Available balance: " + fmt.Sprintf("%0.2f", tokenBalance))
	// 		}
	// 	}
	// }

	//Add token balance to receiver's wallet
	receiverTokenBalanceAsBytes, _ := ctx.GetStub().GetState(projectObj.NGO)
	receiverTokenBalance := 0.0
	if receiverTokenBalanceAsBytes != nil {
		receiverTokenBalance, _ = strconv.ParseFloat(string(receiverTokenBalanceAsBytes), 64)
	}

	receiverFinalBal := fmt.Sprintf("%0.2f", math.Round((receiverTokenBalance+qtyToTransfer)*100)/100)
	ctx.GetStub().PutState(projectObj.NGO, []byte(receiverFinalBal))

	newTx := &Transaction{
		ObjectType:  "Transaction",
		From:        fromAddress,
		To:          projectObj.NGO,
		Qty:         qty,
		TxType:      "TransferToken",
		Date:        date,
		ObjRef:      pId,
		PhaseNumber: -1,
		PaymentId:   paymentId,
		PaymentMode: paymentMode,
	}

	if len(notes) > 0 {
		newTx.Notes = notes
	}

	txAsBytes, _ := json.Marshal(newTx)
	//save the tx to ledger, key is txId1
	ctx.GetStub().PutState(txId1, txAsBytes)

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has transferred " + fmt.Sprintf("%0.2f", qtyToTransfer) + " funds to your project " + projectObj.ProjectName + "."
	notification := &Notification{TxId: txId1, Description: eventPayload, Users: []string{projectObj.NGO}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

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
	mspId, commonName, _ := getTxCreatorInfo(ctx, creator)

	if mspId == CorporateMSP {
		queryString = gqs([]string{"docType", "TokenRequest", "from", commonName})
	} else if mspId == CreditsAuthorityMSP {
		queryString = gqs([]string{"docType", "TokenRequest"})
	} else if mspId == NgoMSP {
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
