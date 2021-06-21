package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type Redeem struct {
	ObjectType        string  `json:"docType"`
	From              string  `json:"from"`
	Qty               float64 `json:"qty"`
	Status            string  `json:"status"` //Requested, Approved, Rejected
	Date              int     `json:"date"`
	PaymentId         string  `json:"paymentId"`
	ReceiverId        string  `json:"receiverId"`
	RejectionComments string  `json:"rejectionComments"`
}

func (s *SmartContract) RedeemRequest(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** RedeemRequest Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		InfoLogger.Printf("only ngo can initiate redeem request")
		return false, fmt.Errorf("only ngo can initiate redeem request")
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
		return false, fmt.Errorf("redeem id must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("amount must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("receiverId must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	redeemId := args[0]
	qty, err := strconv.ParseFloat(args[1], 64)
	if err != nil || qty <= 0.0 {
		return false, fmt.Errorf("Invalid amount!")
	}
	receiverId := args[2]
	date, _ := strconv.Atoi(args[3])
	txId := args[4]
	from := commonName
	to := "ca.creditsauthority.csr.com"

	//check if the redeemId incoming is already used
	getUuidAsBytes, _ := ctx.GetStub().GetState(redeemId)
	if getUuidAsBytes != nil {
		InfoLogger.Printf("This redeem id is already used")
		return false, fmt.Errorf("This redeem id is already used")
	}

	//check if the qty requesting is less than or equal to his balance
	getbalancebytes, _ := ctx.GetStub().GetState(from)
	if getbalancebytes == nil {
		return false, fmt.Errorf("error getting the balance of the ngo")
	}
	balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)
	if balance < qty {
		InfoLogger.Printf("Maximum amount to redeem is:", balance, "but requested amount is:", qty)
		return false, fmt.Errorf("redeem amount cannot be more than the balance")
	}

	//reduce the equivalent amount from the balance of ngo
	remainingQty := balance - qty
	ctx.GetStub().PutState(from, []byte(fmt.Sprintf("%f", remainingQty)))

	//create redeem state
	newReq := &Redeem{
		ObjectType: "Redeem",
		From:       from,
		Qty:        qty,
		Status:     "Requested",
		Date:       date,
		ReceiverId: receiverId,
	}
	redeemReqAsBytes, _ := json.Marshal(newReq)
	ctx.GetStub().PutState(redeemId, redeemReqAsBytes)

	//create corresponding transaction
	createTransaction(ctx, from, to, qty, date, "RequestRedeem", redeemId, txId, -1)

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", qty) + " funds to redeem."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** RedeemRequest Successful ***************")
	return true, nil
}

func (s *SmartContract) ApproveRedeemRequest(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** ApproveRedeemRequest Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can approve redeem request")
		return false, fmt.Errorf("only creditsauthority can approve redeem request")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 4 {
		return false, fmt.Errorf("Incorrect no. of arguments. Expecting 4")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("redeem id must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("payment id must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	redeemId := args[0]
	paymentId := args[1]
	time, _ := strconv.Atoi(args[2])
	txId := args[3]

	//write a selector query to check in chouch so that the same transaction id is not used
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Redeem\",\"paymentId\":\"%s\"}}", paymentId)
	queryResults, err := GetQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	if len(queryResults) > 2 {
		InfoLogger.Printf("Transaction id:", paymentId, "is already used")
		return false, fmt.Errorf("Transaction id: " + paymentId + " is already used")
	}

	redeemStateAsBytes, _ := ctx.GetStub().GetState(redeemId)
	if redeemStateAsBytes == nil {
		InfoLogger.Printf("redeem request:", redeemId, "is not present")
		return false, fmt.Errorf("redeem request: " + redeemId + " is not present")
	}
	redeemState := Redeem{}
	json.Unmarshal(redeemStateAsBytes, &redeemState)

	//already approved redeem request can't be approved again
	if redeemState.Status == "Approved" {
		return false, fmt.Errorf("this redeem request is already approved")
	} else if redeemState.Status == "Requested" {
		//change the status from requested to Approved, and add PaymentId
		redeemState.Status = "Approved"
		redeemState.PaymentId = paymentId

		redeemStateAsBytes, _ = json.Marshal(redeemState)
		ctx.GetStub().PutState(redeemId, redeemStateAsBytes)
	} else {
		return false, fmt.Errorf("Invalid redeem status")
	}

	//create corresponding transaction
	from := commonName
	to := redeemState.From
	qty := redeemState.Qty

	createTransaction(ctx, from, to, qty, time, "ApproveRedeemRequest", redeemId, txId, -1)

	eventPayload := "Your redeem request of " + fmt.Sprintf("%0.2f", qty) + " funds is approved."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** ApproveRedeemRequest Successful ***************")
	return true, nil
}

//get all the redeem requests
func (s *SmartContract) GetRedeemRequest(ctx contractapi.TransactionContextInterface) ([]byte, error) {
	InfoLogger.Printf("*************** getRedeemRequest Started ***************")

	queryString := ""

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return nil, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commanName, _ := getTxCreatorInfo(creator)
	if mspId == "CorporateMSP" {
		InfoLogger.Printf("corporate cannot access RedeemRequest")
		return nil, fmt.Errorf("corporate cannot access RedeemRequest")
	} else if mspId == "CreditsAuthorityMSP" {
		queryString = gqs([]string{"docType", "Redeem"})
	} else if mspId == "NgoMSP" {
		queryString = gqs([]string{"docType", "Redeem", "from", commanName})
	} else {
		return nil, fmt.Errorf("Invalid user")
	}
	InfoLogger.Printf("current logged in user:", commanName, "with mspId:", mspId)

	queryResults, err := GetQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return nil, fmt.Errorf(err.Error())
	}

	InfoLogger.Printf("*************** getRedeemRequest Successfull ***************")
	return queryResults, nil
}

func (s *SmartContract) RejectRedeemRequest(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** rejectRedeemRequest Started ***************")
	InfoLogger.Printf("args received:", arg)

	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		InfoLogger.Printf("only creditsauthority can verify/approve redeem request")
		return false, fmt.Errorf("only creditsauthority can verify/approve redeem request")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 4 {
		return false, fmt.Errorf("Incorrect no. of arguments. Expecting 4")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("redeem id must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("rejection comments must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("tx id must be a non-empty string")
	}

	redeemId := args[0]
	rejectionComments := args[1]
	time, _ := strconv.Atoi(args[2])
	txId := args[3]

	if len(rejectionComments) == 0 {
		return false, fmt.Errorf("rejection comments is mandatory!")
	}

	redeemStateAsBytes, _ := ctx.GetStub().GetState(redeemId)
	if redeemStateAsBytes == nil {
		InfoLogger.Printf("redeem request with id:", redeemId, " not found")
		return false, fmt.Errorf("redeem request: " + redeemId + " not found")
	}
	redeemState := Redeem{}
	json.Unmarshal(redeemStateAsBytes, &redeemState)

	redeemState.RejectionComments = rejectionComments

	var txType string
	if redeemState.Status == "Requested" {
		txType = "RedeemReject"
		redeemState.Status = "Rejected"
		redeemStateAsBytes, _ = json.Marshal(redeemState)
		ctx.GetStub().PutState(redeemId, redeemStateAsBytes)
	} else {
		return false, fmt.Errorf("invalid redeem status!" + redeemState.Status)
	}

	//give back the tokens to Ngo
	getbalancebytes, _ := ctx.GetStub().GetState(redeemState.From)
	if getbalancebytes == nil {
		return false, fmt.Errorf("error getting the balance of the ngo")
	}
	balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)

	//add the redeem amount to the balance of ngo upon reject
	updatedBal := balance + redeemState.Qty
	ctx.GetStub().PutState(redeemState.From, []byte(fmt.Sprintf("%f", updatedBal)))

	//create a transaction
	from := commonName
	to := redeemState.From
	qty := redeemState.Qty

	createTransaction(ctx, from, to, qty, time, txType, redeemId, txId, -1)

	eventPayload := "Your redeem request of " + fmt.Sprintf("%0.2f", qty) + " credits is " + redeemState.Status + "."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** rejectRedeemRequest Successful ***************")
	return true, nil
}
