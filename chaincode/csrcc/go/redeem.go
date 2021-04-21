package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type Redeem struct {
	ObjectType   string  `json:"docType"`
	From         string  `json:"from"`
	Qty          float64 `json:"qty"`
	Status       string  `json:"status"`
	Date         int     `json:"date"`
	BankTxId     string  `json:"bankTxId"`
	ProofDocName string  `json:"proofDocName"`
	ProofDocHash string  `json:"proofDocHash"`
}

func (s *SmartContract) RedeemRequest(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** redeemRequest Started ***************")
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

	uuid := args[0]
	qty, _ := strconv.ParseFloat(args[1], 64)
	date, _ := strconv.Atoi(args[2])
	txId := args[3]
	from := commonName
	to := "ca.creditsauthority.csr.com"
	status := "Requested"
	bankTxId := ""

	//check if the uuid incoming is already used
	getUuidAsBytes, _ := ctx.GetStub().GetState(uuid)
	if getUuidAsBytes != nil {
		InfoLogger.Printf("This uuid is already used")
		return false, fmt.Errorf("This uuid is already used")
	}

	//chech if the qty requesting is less than or equal to his balance
	getbalancebytes, _ := ctx.GetStub().GetState(from)
	if getbalancebytes == nil {
		return false, fmt.Errorf("error getting the balance of the ngo")
	}
	balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)
	if balance < qty {
		InfoLogger.Printf("Maximum amount to redeem is:", balance, "but requested amount is:", qty)
		return false, fmt.Errorf("redeemed amount cannot be more than the balance")
	}

	//reduce the equavalent amount from the balance of ngo upon requesting
	remainingQty := balance - qty
	ctx.GetStub().PutState(from, []byte(fmt.Sprintf("%f", remainingQty)))

	//create redeem state
	newReq := &Redeem{ObjectType: "Redeem", From: from, Qty: qty, Status: status, BankTxId: bankTxId, Date: date}
	redeemReqAsBytes, _ := json.Marshal(newReq)
	ctx.GetStub().PutState(uuid, redeemReqAsBytes)

	//create corresponding transaction
	createTransaction(ctx, from, to, qty, date, "RequestRedeem", uuid, txId, -1)

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", qty) + " credits to redeem."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** redeemRequest Successful ***************")
	return true, nil
}

func (s *SmartContract) ApproveRedeemRequest(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** approveRedeemRequest Started ***************")
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

	uuid := args[0]
	bankTxId := args[1]
	proofDocName := args[4]
	proofDocHash := args[5]

	time, _ := strconv.Atoi(args[2])
	txId := args[3]

	//write a selector query to check in chouch so that the same transaction id is not used
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Redeem\",\"bankTxId\":\"%s\"}}", bankTxId)
	queryResults, err := GetQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	if len(queryResults) > 2 {
		InfoLogger.Printf("Transaction id:", bankTxId, "is already used")
		return false, fmt.Errorf("Transaction id: " + bankTxId + " is already used")
	}

	redeemStateAsBytes, _ := ctx.GetStub().GetState(uuid)
	if redeemStateAsBytes == nil {
		InfoLogger.Printf("uuid:", uuid, "is not present")
		return false, fmt.Errorf("uuid: " + uuid + " is not present")
	}
	redeemState := Redeem{}
	json.Unmarshal(redeemStateAsBytes, &redeemState)

	//already approved redeeState cannnot be approved again
	if redeemState.Status == "Approved" {
		return false, fmt.Errorf("Following redeemRequest is already been approved and served with fiat curency")
	} else if redeemState.Status == "Requested" {

		//change the status from requested to Approved , and add BankTxId
		redeemState.Status = "Approved"
		redeemState.BankTxId = bankTxId
		redeemState.ProofDocName = proofDocName
		redeemState.ProofDocHash = proofDocHash

		//update RedeemState
		redeemStateAsBytes, _ = json.Marshal(redeemState)
		ctx.GetStub().PutState(uuid, redeemStateAsBytes)
	} else {
		return false, fmt.Errorf("Invalid redeem status")
	}

	//create corresponding transaction
	from := commonName
	to := redeemState.From
	qty := redeemState.Qty

	createTransaction(ctx, from, to, qty, time, "ApproveRedeemRequest", uuid, txId, -1)

	eventPayload := "Your redeem request of " + fmt.Sprintf("%0.2f", qty) + " credits is approved."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := ctx.GetStub().SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return false, fmt.Errorf(fmt.Sprintf("Failed to emit event"))
	}

	InfoLogger.Printf("*************** approveRedeemRequest Successful ***************")
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
