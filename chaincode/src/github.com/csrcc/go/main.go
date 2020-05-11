package main

/* Imports
 * 4 utility libraries for formatting, handling bytes, reading and writing JSON, and string manipulation
 * 2 specific Hyperledger Fabric specific libraries for Smart Contracts
 */
import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

var logger = shim.NewLogger("token")

// Define the Smart Contract structure
type SmartContract struct {
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
