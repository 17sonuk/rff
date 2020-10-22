package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
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

func (s *SmartContract) redeemRequest(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** redeemRequest Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		logger.Info("only ngo can initiate redeem request")
		return shim.Error("only ngo can initiate redeem request")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	uuid := args[0]
	qty, _ := strconv.ParseFloat(args[1], 64)
	date, _ := strconv.Atoi(args[2])
	txId := args[3]
	from := commonName
	to := "ca.creditsauthority.csr.com"
	status := "Requested"
	bankTxId := ""

	//check if the uuid incoming is already used
	getUuidAsBytes, _ := APIstub.GetState(uuid)
	if getUuidAsBytes != nil {
		logger.Info("This uuid is already used")
		return shim.Error("This uuid is already used")
	}

	//chech if the qyt requesting is less than or equal to his balancew
	getbalancebytes, _ := APIstub.GetState(from)
	if getbalancebytes == nil {
		return shim.Error("error getting the balance of the ngo")
	}
	balance, _ := strconv.ParseFloat(string(getbalancebytes), 64)
	if balance < qty {
		logger.Info("Maximum amount to redeem is:", balance, "but requested amount is:", qty)
		return shim.Error("redeemed amount cannot be more than the balance")
	}

	//reduce the equavalent amount from the balance of ngo upon requesting
	remainingQty := balance - qty
	APIstub.PutState(from, []byte(fmt.Sprintf("%f", remainingQty)))

	//create redeem state
	newReq := &Redeem{ObjectType: "Redeem", From: from, Qty: qty, Status: status, BankTxId: bankTxId, Date: date}
	redeemReqAsBytes, _ := json.Marshal(newReq)
	APIstub.PutState(uuid, redeemReqAsBytes)

	//create corresponding transaction
	createTransaction(APIstub, from, to, qty, date, "RequestRedeem", uuid, txId, -1)

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", qty) + " credits to redeem."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** redeemRequest Successful ***************")
	return shim.Success(nil)
}

func (s *SmartContract) approveRedeemRequest(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** approveRedeemRequest Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		logger.Info("only creditsauthority can approve redeem request")
		return shim.Error("only creditsauthority can approve redeem request")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	uuid := args[0]
	bankTxId := args[1]
	proofDocName := args[4]
	proofDocHash := args[5]

	time, _ := strconv.Atoi(args[2])
	txId := args[3]

	//write a selector query to check in chouch so that the same transaction id is not used
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Redeem\",\"bankTxId\":\"%s\"}}", bankTxId)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	if len(queryResults) > 2 {
		logger.Info("Transaction id:", bankTxId, "is already used")
		return shim.Error("Transaction id: " + bankTxId + " is already used")
	}

	redeemStateAsBytes, _ := APIstub.GetState(uuid)
	if redeemStateAsBytes == nil {
		logger.Info("uuid:", uuid, "is not present")
		return shim.Error("uuid: " + uuid + " is not present")
	}
	redeemState := Redeem{}
	json.Unmarshal(redeemStateAsBytes, &redeemState)

	//already approved redeeState cannnot be approved again
	if redeemState.Status == "Approved" {
		return shim.Error("Following redeemRequest is already been approved and served with fiat curency")
	} else if redeemState.Status == "Requested" {

		//change the status from requested to Approved , and add BankTxId
		redeemState.Status = "Approved"
		redeemState.BankTxId = bankTxId
		redeemState.ProofDocName = proofDocName
		redeemState.ProofDocHash = proofDocHash

		//update RedeemState
		redeemStateAsBytes, _ = json.Marshal(redeemState)
		APIstub.PutState(uuid, redeemStateAsBytes)
	} else {
		return shim.Error("Invalid redeem status")
	}

	//create corresponding transaction
	from := commonName
	to := redeemState.From
	qty := redeemState.Qty

	createTransaction(APIstub, from, to, qty, time, "ApproveRedeemRequest", uuid, txId, -1)

	eventPayload := "Your redeem request of " + fmt.Sprintf("%0.2f", qty) + " credits is approved."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{to}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** approveRedeemRequest Successful ***************")
	return shim.Success(nil)
}
