package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("token")

// Define the Smart Contract structure
type SmartContract struct {
}

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

func main() {
	// Create a new Smart Contract
	err := shim.Start(new(SmartContract))
	if err != nil {
		fmt.Printf("Error starting Contract Chaincode: %s", err)
	}
}

//Init function
func (s *SmartContract) Init(APIstub shim.ChaincodeStubInterface) pb.Response {
	APIstub.PutState("snapshot_exists", []byte("0"))
	return shim.Success(nil)
}

/*
 * The Invoke method is called as a result of an application request to run the Smart Contract "token"
 * The calling application program has also specified the particular smart contract function to be called, with arguments
 */
func (s *SmartContract) Invoke(APIstub shim.ChaincodeStubInterface) pb.Response {

	// Retrieve the requested Smart Contract function and arguments
	function, args := APIstub.GetFunctionAndParameters()

	// Route to the appropriate handler function to interact with the ledger appropriately
	if function == "requestTokens" {
		return s.requestTokens(APIstub, args)
	} else if function == "rejectTokens" {
		return s.rejectTokens(APIstub, args)
	} else if function == "queryByKey" {
		return s.queryByKey(APIstub, args)
	} else if function == "assignTokens" {
		return s.assignTokens(APIstub, args)
	} else if function == "transferTokens" {
		return s.transferTokens(APIstub, args)
	} else if function == "snapshotCurrentCorporateBalances" {
		return s.snapshotCurrentCorporateBalances(APIstub, args)
	} else if function == "transferUnspentTokensToGovt" {
		return s.transferUnspentTokensToGovt(APIstub, args)
	} else if function == "getBalance" {
		return s.getBalance(APIstub)
	} else if function == "queryForAllTokenRequests" {
		return s.queryForAllTokenRequests(APIstub)
	} else if function == "queryForSnapshot" {
		return s.queryForSnapshot(APIstub, args)
	} else if function == "queryForTransactionRange" {
		return s.queryForTransactionRange(APIstub, args)
	} else if function == "createProject" {
		return s.createProject(APIstub, args)
	} else if function == "queryAllProjects" {
		return s.queryAllProjects(APIstub, args)
	} else if function == "redeemRequest" {
		return s.redeemRequest(APIstub, args)
	} else if function == "approveRedeemRequest" {
		return s.approveRedeemRequest(APIstub, args)
	} else if function == "reserveFundsForProject" {
		return s.reserveFundsForProject(APIstub, args)
	} else if function == "releaseFundsForProject" {
		return s.releaseFundsForProject(APIstub, args)
	} else if function == "getRedeemRequest" {
		return s.getRedeemRequest(APIstub)
	} else if function == "getTransaction" {
		return s.getTransaction(APIstub)
	} else if function == "getProjectTransactions" {
		return s.getProjectTransactions(APIstub, args)
	} else if function == "updateProject" {
		return s.updateProject(APIstub, args)
	} else if function == "validatePhase" {
		return s.validatePhase(APIstub, args)
	} else if function == "addDocumentHash" {
		return s.addDocumentHash(APIstub, args)
	} else if function == "generalQueryFunction" {
		return s.generalQueryFunction(APIstub, args)
	} else if function == "generalQueryFunctionPagination" {
		return s.generalQueryFunctionPagination(APIstub, args)
	} else if function == "getCorporateDetails" {
		return s.getCorporateDetails(APIstub)
	} else if function == "getAllCorporates" {
		return s.getAllCorporates(APIstub)
	} else if function == "addCorporatePan" {
		return s.addCorporatePan(APIstub, args)
	} else if function == "saveItData" {
		return s.saveItData(APIstub, args)
	}
	return shim.Error("Invalid Smart Contract function name.")
}

//request tokens
func (s *SmartContract) requestTokens(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** requestTokens Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		logger.Info("only corporate can initiate requestTokens")
		return shim.Error("only corporate can initiate requestTokens")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 7 {
		return shim.Error("Incorrect no. of arguments. Expecting 7")
	} else if len(args[0]) <= 0 {
		return shim.Error("Qty must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("role must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("bank tx id must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return shim.Error("doc name must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return shim.Error("doc hash must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return shim.Error("txid must be a non-empty string")
	}
	//from,qty,role,txid
	tokenQty, err := strconv.ParseFloat(args[0], 64)
	if err != nil {
		return shim.Error("Error converting tokenQty " + err.Error())
	}
	fromAddress := commonName
	toAddress := "ca.creditsauthority.csr.com"
	callerRole := strings.ToLower(args[1])
	bankTxId := args[2]
	proofDocName := args[3]
	proofDocHash := args[4]
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return shim.Error("Error converting date " + err.Error())
	}
	txId := args[6]
	tokenRequestAsBytes := []byte{}

	oldTokenRequestAsBytes, _ := APIstub.GetState(bankTxId)
	if oldTokenRequestAsBytes != nil {
		//Update existing token with Requested status
		tokenRequest := TokenRequest{}
		err = json.Unmarshal(oldTokenRequestAsBytes, &tokenRequest)
		if tokenRequest.Status != "Rejected" {
			return shim.Error("Token request with this ID already exists with " + tokenRequest.Status + " status")
		}
	}
	newReq := &TokenRequest{ObjectType: "TokenRequest", From: fromAddress, Qty: tokenQty, Role: callerRole, Status: "Requested", Date: date, BankTxId: bankTxId, ProofDocName: proofDocName, ProofDocHash: proofDocHash}
	tokenRequestAsBytes, err = json.Marshal(newReq)

	//save the request to ledger, key is args[4] i.e. bankTxId
	APIstub.PutState(bankTxId, tokenRequestAsBytes)

	//Save Corporates if not already saved
	//TODO: See if this can be filled and updated at registration time instead of on every token request
	if callerRole == "corporate.csr.com" {

		corporates := getCorporates(APIstub)

		if len(corporates) == 0 || !contains(corporates, fromAddress) {
			corporates = append(corporates, fromAddress)
			corporatesInBytes, _ := json.Marshal(corporates)
			APIstub.PutState("corporates", corporatesInBytes)
		}
	}

	err = createTransaction(APIstub, fromAddress, toAddress, tokenQty, date, "TokenRequest", bankTxId, txId, -1)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has requested " + fmt.Sprintf("%0.2f", tokenQty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{toAddress}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}
	logger.Info("*************** requestTokens Successfull ***************")
	return shim.Success(tokenRequestAsBytes)
}

//reject the token request
func (s *SmartContract) rejectTokens(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** rejectTokens Started ***************")
	logger.Info("args received:", args)

	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		logger.Info("only creditsauthority can initiate rejectTokens")
		return shim.Error("only creditsauthority can initiate rejectTokens")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 4")
	} else if len(args[0]) <= 0 {
		return shim.Error("bankTxId must be non-empty")
	} else if len(args[1]) <= 0 {
		return shim.Error("comments must be non-empty")
	} else if len(args[2]) <= 0 {
		return shim.Error("date must be non-empty")
	} else if len(args[3]) <= 0 {
		return shim.Error("tx Id must be non-empty")
	}

	bankTxId := args[0]
	comments := args[1]
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[3]

	//fetch Tokenrequest by bankTx id, unmarshal to Token request, change the status field to Rejected
	tokenRequestAsBytes, _ := APIstub.GetState(bankTxId)
	if tokenRequestAsBytes == nil {
		return shim.Error("No such TokenRequest exists")
	}

	tokenRequest := TokenRequest{}
	json.Unmarshal(tokenRequestAsBytes, &tokenRequest)

	if tokenRequest.Status == "Requested" {
		tokenRequest.Status = "Rejected"
		tokenRequest.Comments = comments
	} else {
		return shim.Error("Invalid status, TokenRequest's Status should be Requested")
	}

	tokenRequestAsBytes, _ = json.Marshal(tokenRequest)
	APIstub.PutState(bankTxId, tokenRequestAsBytes)

	err = createTransaction(APIstub, "Admin@creditsauthority.csr.com", tokenRequest.From, tokenRequest.Qty, date, "TokenReject", bankTxId, txId, -1)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has rejected your request of " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** rejectTokens Successfull ***************")
	return shim.Success(nil)
}

//CA assigns tokens to the corporates/citizens
func (s *SmartContract) assignTokens(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** assignTokens Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		logger.Info("only creditsauthority can initiate assignTokens")
		return shim.Error("only creditsauthority can initiate assignTokens")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return shim.Error("bank tx id must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("tx id must be a non-empty string")
	}

	bankTxId := args[0]
	date, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[2]

	tokenRequestAsBytes, _ := APIstub.GetState(bankTxId)
	if tokenRequestAsBytes == nil {
		return shim.Error("No such token request exists")
	}

	tokenRequest := TokenRequest{}
	err = json.Unmarshal(tokenRequestAsBytes, &tokenRequest)
	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	}

	//validity check so that approved TokenRequest are not served twice and rejected TokenRequest is not assigned
	if tokenRequest.Status == "Assigned" {
		logger.Info("TokenRequest with id:", bankTxId, "is already approved")
		return shim.Error("TokenRequest with id: " + bankTxId + " is already approved")
	} else if tokenRequest.Status == "Rejected" {
		logger.Info("Rejected TokenRequest cannot be Assigned")
		return shim.Error("Rejected TokenRequest cannot be Assigned")
	}

	tokenBalanceAsBytes, _ := APIstub.GetState(tokenRequest.From)
	if tokenBalanceAsBytes == nil {
		APIstub.PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", tokenRequest.Qty)))
	} else {
		balance, _ := strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
		APIstub.PutState(tokenRequest.From, []byte(fmt.Sprintf("%0.2f", balance+tokenRequest.Qty)))
	}

	tokenRequest.Status = "Assigned"
	tokenReqBytes, err := json.Marshal(tokenRequest)
	if err != nil {
		return shim.Error("Marshal error")
	}
	APIstub.PutState(bankTxId, tokenReqBytes)

	//TODO: verify the CSR address
	err = createTransaction(APIstub, "ca.creditsauthority.csr.com", tokenRequest.From, tokenRequest.Qty, date, "AssignToken", bankTxId, txId, -1)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	eventPayload := "You are assigned  " + fmt.Sprintf("%0.2f", tokenRequest.Qty) + " credits."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{tokenRequest.From}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** assignTokens Successfull ***************")
	return shim.Success(nil)
}

//transfer tokens from corporate to ngo
func (s *SmartContract) transferTokens(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** transferTokens Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		logger.Info("only corporate can initiate transferTokens")
		return shim.Error("only corporate can initiate transferTokens")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 7")
	} else if len(args[0]) <= 0 {
		return shim.Error("1st argument must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("2nd argument must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("3rd argument must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return shim.Error("4th argument must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return shim.Error("5th argument must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return shim.Error("6th argument must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return shim.Error("7th argument must be a non-empty string")
	}

	var flagSnapshot = false
	var snapshotTokenUsed = 0.0

	//donated amount
	qty, err := strconv.ParseFloat(args[0], 64)
	if err != nil {
		return shim.Error("convertion failed: " + err.Error())
	}
	qtyToTransfer := qty

	pId := args[1]
	fromAddress := commonName
	phaseNumber, err := strconv.Atoi(args[2])
	if err != nil {
		return shim.Error("phase number is incorrect!")
	}
	reviewMsg := args[3]
	rating, err := strconv.Atoi(args[4])
	if err != nil {
		return shim.Error("rating is incorrect!")
	}
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return shim.Error("incorrect date: " + err.Error())
	}
	txId1 := args[6]
	txId2 := args[7]

	//Get existing project
	projectAsBytes, _ := APIstub.GetState(pId)
	if projectAsBytes == nil {
		return shim.Error("No such project exists!")
	}
	projectObj := Project{}
	err = json.Unmarshal(projectAsBytes, &projectObj)
	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	}

	//to be used during actual run.
	if projectObj.Phases[phaseNumber].PhaseState == "Open For Funding" || projectObj.Phases[phaseNumber].PhaseState == "Partially Funded" {
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
		return shim.Error("Funding is not allowed to this phase!")
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
		return shim.Error("Json convert error" + err.Error())
	}

	err = APIstub.PutState(pId, updatedProjectAsBytes)
	if err != nil {
		return shim.Error("error saving/updating project" + err.Error())
	}

	snapshotExistsBytes, _ := APIstub.GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		return shim.Error("Failed to get snapshot Exists: " + err.Error())
	}

	//check if there is a snapshot (flag  = true) and if there are any funds in snapshot
	if string(snapshotExistsBytes) == "1" {
		snapshotKey := fromAddress + "_snapshot"

		//Get the balance in Snapshot for corporate
		snapShotBalanceInBytes, _ := APIstub.GetState(snapshotKey)
		if snapShotBalanceInBytes == nil {
			return shim.Error("Failed to get token balance from snapshot: " + err.Error())
		}

		snapshotBalance, _ := strconv.ParseFloat(string(snapShotBalanceInBytes), 64)

		if snapshotBalance >= qty {
			//use the snapshot funds and then use the current fund
			balance := fmt.Sprintf("%0.2f", snapshotBalance-qty)

			//take account of how much snapshot account is used to create transaction
			flagSnapshot = true
			snapshotTokenUsed = qty
			logger.Info("a")
			logger.Info(snapshotTokenUsed)

			APIstub.PutState(snapshotKey, []byte(balance))
			qty = 0
		} else {
			qty -= snapshotBalance

			//take account of how much snapshot account is used to create transaction
			flagSnapshot = true
			snapshotTokenUsed = snapshotBalance
			logger.Info("b")
			logger.Info(snapshotTokenUsed)
			
			APIstub.PutState(snapshotKey, []byte("0"))
		}
	}

	//if there is no snapshot, use the current account
	if qty > 0.0 {
		//reduce token balance from sender
		tokenBalanceInBytes, _ := APIstub.GetState(fromAddress)
		if tokenBalanceInBytes == nil {
			return shim.Error("Failed to get token balance to transfer: ")
		}
		tokenBalance, _ := strconv.ParseFloat(string(tokenBalanceInBytes), 64)

		if tokenBalance >= qty {
			finalQty := fmt.Sprintf("%0.2f", tokenBalance-qty)
			APIstub.PutState(fromAddress, []byte(finalQty))
		} else {
			return shim.Error("Not enough balance " + fromAddress + ".Available balance:" + string(tokenBalanceInBytes))
		}
	}

	//Add token balance to receiver
	receiverTokenBalanceAsBytes, _ := APIstub.GetState(projectObj.NGO)
	receiverTokenBalance := 0.0
	if receiverTokenBalanceAsBytes != nil {
		receiverTokenBalance, _ = strconv.ParseFloat(string(receiverTokenBalanceAsBytes), 64)
	}

	receiverFinalBal := fmt.Sprintf("%0.2f", receiverTokenBalance+qtyToTransfer)
	APIstub.PutState(projectObj.NGO, []byte(receiverFinalBal))
	
	if(qty > 0.0){
		err = createTransaction(APIstub, fromAddress, projectObj.NGO, qty, date, "TransferToken", pId, txId1, phaseNumber)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}
	}
	

	if(flagSnapshot == true){
		err = createTransaction(APIstub, fromAddress, projectObj.NGO, snapshotTokenUsed, date, "TransferToken_snapshot", pId, txId2, phaseNumber)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has transferred " + fmt.Sprintf("%0.2f", qtyToTransfer) + " credits to your project " + projectObj.ProjectName + "."
	notification := &Notification{TxId: txId1, Description: eventPayload, Users: []string{projectObj.NGO}}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** transferTokens Successfull ***************")
	return shim.Success(nil)
}

//At the start of every financial year - Jan1
func (s *SmartContract) snapshotCurrentCorporateBalances(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** snapshotCurrentCorporateBalances Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		logger.Info("only creditsauthority can initiate snapshotCurrentCorporateBalances")
		return shim.Error("only creditsauthority can initiate snapshotCurrentCorporateBalances")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("tx id must be a non-empty string")
	}

	date, err := strconv.Atoi(args[0])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[1]

	corporates := getCorporates(APIstub)
	balancesExist := false
	objRef := ""
	sum := 0.0

	notificationUsers := make([]string, len(corporates))

	//loop through each corporate and create new corporate address and copy non zero balances into corporateAddress_snapshot
	for _, corporate := range corporates {
		qtyBytes, err := APIstub.GetState(corporate)
		if err != nil {
			return shim.Error("Failed to get token balance to transfer: " + err.Error())
		}
		tokenBalance, _ := strconv.ParseFloat(string(qtyBytes), 64)

		if tokenBalance > 0.0 {
			notificationUsers = append(notificationUsers, corporate)
			balancesExist = true
			sum += tokenBalance
			//create a new entry with corporate_snapshot and save his balance or,
			//add token balance to existing snapshot balance.
			snapBalance := 0.0
			snapBalanceInBytes, _ := APIstub.GetState(corporate + "_snapshot")
			if snapBalanceInBytes != nil {
				snapBalance, _ = strconv.ParseFloat(string(snapBalanceInBytes), 64)
			}
			
			APIstub.PutState(corporate+"_snapshot", []byte(fmt.Sprintf("%0.2f", snapBalance + tokenBalance)))
			//reset the original token balance to 0
			APIstub.PutState(corporate, []byte("0"))
			objRef += corporate + ":" + fmt.Sprintf("%0.2f", tokenBalance) + ","
		}
	}

	if balancesExist == true {
		APIstub.PutState("snapshot_exists", []byte("1"))
		objRef = strings.Trim(objRef, ",")
		err = createTransaction(APIstub, commonName, "AllCorporates", sum, date, "BalanceSnapshot", objRef, txId, -1)
		if err != nil {
			return shim.Error("Failed to add a Tx: " + err.Error())
		}
	}

	eventPayload := "A Snapshot of your credits is created. Use them within 30 days."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: notificationUsers}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** snapshotCurrentCorporateBalances Successful ***************")
	return shim.Success(nil)
}

//At the end of 1 year+30 days, the Flag has to be set to false and the balances are to be made 0 for corporates. Fire event TransfertoGovt Qty, From,For the year
func (s *SmartContract) transferUnspentTokensToGovt(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** transferUnspentTokensToGovt Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CreditsAuthorityMSP" {
		logger.Info("only creditsauthority can initiate transferUnspentTokensToGovt")
		return shim.Error("only creditsauthority can initiate transferUnspentTokensToGovt")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return shim.Error("govt address must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("tx id must be a non-empty string")
	}

	//govt address
	govtAddress := args[0] + ".creditsauthority.csr.com"
	csrAddress := commonName
	date, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[2]

	//check if snapshots exists
	snapshotExistsBytes, _ := APIstub.GetState("snapshot_exists")
	if snapshotExistsBytes == nil {
		return shim.Error("Failed to get snapshot Exists: " + err.Error())
	}

	corporates := getCorporates(APIstub)
	qtyBytes := []byte{}
	tokenBalance := 0.0
	escrowBalance := 0.0
	sum := 0.0
	objRef := ""

	notificationUsers := make([]string, len(corporates))

	//sum and clear the snapshot balances and transfer tokens to Govt address
	for _, corporate := range corporates {
		qtyBytes, _ = APIstub.GetState(corporate + "_snapshot")
		tokenBalance = 0.0
		escrowBalance = 0.0
		if qtyBytes != nil {
			tokenBalance, _ = strconv.ParseFloat(string(qtyBytes), 64)
			if tokenBalance > 0.0 {
				notificationUsers = append(notificationUsers, corporate)
				logger.Info("token balance:", tokenBalance)
				//set snapshot balance to 0
				APIstub.PutState(corporate+"_snapshot", []byte(string("0")))
				objRef += corporate + ":normal:" + fmt.Sprintf("%0.2f", tokenBalance) + ","
			}
		}

		//remove expired escrow balances of the coporate
		//get all locked obj of a corporate
		queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"corporate\": \"%s\"}, \"fields\": [\"_id\"]}", corporate)
		queryResults, err := getQueryResultForQueryString(APIstub, queryString)
		if err != nil {
			return shim.Error(err.Error())
		}
		logger.Info("query result:", string(queryResults))

		var listOfIds []map[string]string
		err = json.Unmarshal([]byte(queryResults), &listOfIds)
		logger.Info(listOfIds)

		// loop through each project where credits are locked.
		for _, value := range listOfIds {
			escrowObj := UnspentCSRAccount{}
			escrowAsBytes, _ := APIstub.GetState(value["Key"])
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
			logger.Info("TmpFunds: ", tmpFunds)
			escrowObj.Funds = tmpFunds
			//if funds still exist, make leastValidity = validity of the 1st fund.
			if len(tmpFunds) != 0 {
				escrowObj.LeastValidity = tmpFunds[0].Validity
			}

			//marshal the updated escrow and save it.
			marshalEscrow, err := json.Marshal(escrowObj)
			if err != nil {
				return shim.Error(err.Error())
			}
			APIstub.PutState(value["Key"], marshalEscrow)
		}
		if escrowBalance > 0.0 {
			objRef += corporate + ":escrow:" + fmt.Sprintf("%0.2f", escrowBalance) + ","
		}

		sum += tokenBalance + escrowBalance
	}
	objRef = strings.Trim(objRef, ",")
	logger.Info("obj Ref:", objRef)
	if sum == 0.0 {
		return shim.Error("No unspent tokens exist!")
	}

	//Add tokens to Govt/do an update
	govtBalance := 0.0
	govtBalanceInBytes, _ := APIstub.GetState(govtAddress)
	if govtBalanceInBytes != nil {
		govtBalance, _ = strconv.ParseFloat(string(govtBalanceInBytes), 64)
	}

	APIstub.PutState(govtAddress, []byte(fmt.Sprintf("%0.2f", govtBalance + sum)))
	APIstub.PutState("snapshot_exists", []byte("0"))

	err = createTransaction(APIstub, csrAddress, govtAddress, sum, date, "ClosingYearFundTransfer", objRef, txId, -1)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	eventPayload := "Your unspent credits are transferred to Government."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: notificationUsers}
	notificationtAsBytes, err := json.Marshal(notification)
	eventErr := APIstub.SetEvent("Notification", notificationtAsBytes)
	if eventErr != nil {
		return shim.Error(fmt.Sprintf("Failed to emit event"))
	}

	logger.Info("*************** transferUnspentTokensToGovt Successful ***************")
	return shim.Success(nil)
}

func (s *SmartContract) queryForSnapshot(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	corporates := getCorporates(APIstub)

	var buffer bytes.Buffer
	buffer.WriteString("[")
	bArrayMemberAlreadyWritten := false

	for _, corporate := range corporates {
		qtyBytes, err := APIstub.GetState(corporate + "_snapshot")
		if err != nil {
			return shim.Error("Failed to get snapshot: " + err.Error())
		}
		tokenBalance := string(qtyBytes)

		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"corporateName\":\"")
		buffer.WriteString(corporate)
		buffer.WriteString("\", \"balance\":")
		buffer.WriteString(tokenBalance)
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return shim.Success(buffer.Bytes())
}

func (s *SmartContract) queryForTransactionRange(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return shim.Error("1st argument must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return shim.Error("2nd argument must be a non-empty string")
	}

	fromDate, err := strconv.Atoi(args[0])
	if err != nil {
		return shim.Error("Error converting date " + err.Error())
	}
	toDate, nil := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error("Error converting date " + err.Error())
	}

	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Transaction\", \"date\":{ \"$and\":[{ \"$gt\":%d }, {\"$lt\":%d}]}}}", fromDate, toDate)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)
}

func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

func constructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":")
		buffer.WriteString("\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\"")

		buffer.WriteString(", \"Record\":")
		// Record is a JSON object, so we write as-is
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}

func tempgetQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, err := stub.GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := tempconstructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", buffer.String())

	return buffer.Bytes(), nil
}

func tempconstructQueryResponseFromIterator(resultsIterator shim.StateQueryIteratorInterface) (*bytes.Buffer, error) {
	// buffer is a JSON array containing QueryResults
	var buffer bytes.Buffer
	buffer.WriteString("[")

	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		logger.Info("queryResponse")
		logger.Info(queryResponse)
		if err != nil {
			return nil, err
		}
		// Add a comma before array members, suppress it for the first array member
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		// buffer.WriteString("{\"Key\":")
		// buffer.WriteString("\"")
		// buffer.WriteString(queryResponse.Key)
		// buffer.WriteString("\"")

		//buffer.WriteString("{\"Record\":")
		// Record is a JSON object, so we write as-is

		buffer.WriteString(string(queryResponse.Value))
		//buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")

	return &buffer, nil
}
