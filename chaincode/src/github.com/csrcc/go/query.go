package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	// "github.com/hyperledger/fabric-chaincode-go/shim"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

//get all the transactions
func (s *SmartContract) getTransaction(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** getTransaction Started ***************")

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)

	queryString := gqs([]string{"docType", "Transaction", "from", commonName})

	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** getTransaction Successful ***************")
	return shim.Success(queryResults)
}

// query callback representing the query of a chaincode
func (s *SmartContract) queryByKey(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1")
	}

	requestAsBytes, _ := APIstub.GetState(args[0])
	if requestAsBytes == nil {
		return shim.Error("No data exists for the key: " + args[0])
	}
	return shim.Success(requestAsBytes)
}

//query for all token request
func (s *SmartContract) queryForAllTokenRequests(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** queryForAllTokenRequests Started ***************")

	queryString := ""

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)

	if mspId == "CorporateMSP" {
		queryString = gqs([]string{"docType", "TokenRequest", "from", commonName})
	} else if mspId == "CreditsAuthorityMSP" {
		queryString = gqs([]string{"docType", "TokenRequest"})
	} else if mspId == "NgoMsp" {
		return shim.Error("request token is not valid for Ngo")
	} else {
		logger.Info("Invalid request")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)
	logger.Info("QueryString", queryString)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** queryForAllTokenRequests Successful ***************")
	return shim.Success(queryResults)
}

///to get balence of any org
func (s *SmartContract) getBalance(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** getBalance Started ***************")

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)

	logger.Info("current logged in user :", commonName, " with mspId :", mspId)

	allBalances := make(map[string]float64)
	amount := 0.0

	tokenBalanceAsBytes, _ := APIstub.GetState(commonName)
	snapshotBalanceAsBytes, _ := APIstub.GetState(commonName + "_snapshot")

	//fetch all escrow funds
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"corporate\": \"%s\"}}", commonName)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	logger.Info("query result:", string(queryResults))

	var result []map[string]interface{}
	err = json.Unmarshal([]byte(queryResults), &result)

	for _, value := range result {
		for _, fundObj := range value["Record"].(map[string]interface{})["funds"].([]interface{}) {
			amount += fundObj.(map[string]interface{})["qty"].(float64)
		}
	}

	if amount > 0.0 {
		allBalances["escrowBalance"] = amount
	}
	if tokenBalanceAsBytes != nil {
		amount, _ = strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
		allBalances["balance"] = amount
	}
	if snapshotBalanceAsBytes != nil {
		amount, _ = strconv.ParseFloat(string(snapshotBalanceAsBytes), 64)
		allBalances["snapshotBalance"] = amount
	}

	balJSON, _ := json.Marshal(allBalances)
	jsonStr := string(balJSON)
	logger.Info("*************** getBalance Successfull ***************")
	return shim.Success([]byte(jsonStr))
}

//get all the redeem requests
func (s *SmartContract) getRedeemRequest(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** getRedeemRequest Started ***************")

	queryString := ""

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commanName, _ := getTxCreatorInfo(creator)
	if mspId == "CorporateMSP" {
		logger.Info("corporate cannot access RedeemRequest")
		return shim.Error("corporate cannot access RedeemRequest")
	} else if mspId == "CreditsAuthorityMSP" {
		queryString = gqs([]string{"docType", "Redeem"})
	} else if mspId == "NgoMSP" {
		queryString = gqs([]string{"docType", "Redeem", "from", commanName})
	} else {
		return shim.Error("Invalid user")
	}
	logger.Info("current logged in user:", commanName, "with mspId:", mspId)

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** getRedeemRequest Successfull ***************")
	return shim.Success(queryResults)
}

//list of all the transaction on perticular project
func (s *SmartContract) getProjectTransactions(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** getProjectTransactions Started ***************")

	queryString := ""

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commanName, _ := getTxCreatorInfo(creator)

	logger.Info("current logged in user:", commanName, "with mspId:", mspId)
	queryString = gqs([]string{"docType", "Transaction", "objRef", args[0]})

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** getProjectTransactions Successfull ***************")
	return shim.Success(queryResults)
}

type Record struct{
	Qty float64 `json:qty`
	Balance float64 `json:balance`
	EscrowBalance float64 `json:escrowBalance`
	SnapshotBalance float64 `json:snapshotBalance`
	Corporate string `json:corporate`
	Id string `json:_id`
	ProjectCount float64 `json:projectCount`
}

//getCorporateDetails 
func (s *SmartContract) getCorporateDetails(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** getCorporateDetails Started ***************")

	organisations := getCorporates(APIstub)
	recordObj:=Record{}
	var endResult []Record
	var sum float64

	for _,org := range organisations {

		//get value of how much amount that csr has issued to corporate
		queryString := "{\"selector\":{\"docType\":\"Transaction\",\"txType\":\"assignTokens\",\"to\":\"" + org + "\"},\"fields\":[\"qty\"]}"
		queryResults, err := tempgetQueryResultForQueryString(APIstub, queryString)
		if err != nil {
			return shim.Error(err.Error())
		}
		var testObj []Record
		err=json.Unmarshal(queryResults,&testObj)
		if err != nil {
			return shim.Error(err.Error())
		}
		sum = 0.0
		for i:=0;i<len(testObj);i++{
			sum+=testObj[i].Qty
		}

		//get balance of corresponding corporates
		result1 := s.getBalanceCorporate(APIstub,org)
		logger.Info(string(result1.Payload))
		json.Unmarshal(result1.Payload,&recordObj)
		balance := recordObj.Balance
		escrowBalance := recordObj.EscrowBalance
		snapshotBalance := recordObj.SnapshotBalance
		
		//get the no of ongoing projects they are working
		list1 := strings.Split(org, ".")
		res := list1[0] + "\\\\." + list1[1] + "\\\\." + list1[2] + "\\\\." + list1[3]
		queryString = "{\"selector\":{\"docType\":\"Project\",\"contributors."+ res +"\":{\"$exists\":true}},\"fields\":[\"_id\"]}"
		queryResults, err = getQueryResultForQueryString(APIstub, queryString)
		if err != nil {
			return shim.Error(err.Error())
		}
		err=json.Unmarshal(queryResults,&testObj)
		if err != nil {
			return shim.Error(err.Error())
		}
		projectCount := len(testObj)

		//create new object to send

		recordObj=Record{}
		recordObj.Corporate = org
		recordObj.Qty = sum
		recordObj.Balance = balance
		recordObj.EscrowBalance = escrowBalance
		recordObj.SnapshotBalance = snapshotBalance
		recordObj.ProjectCount = float64(projectCount)

		endResult = append(endResult,recordObj)
	}

	bytAr,err:=json.Marshal(endResult)
	if err!=nil{
		return shim.Error(err.Error())
	}

	logger.Info("*************** getCorporateDetails Successfull ***************")
	return shim.Success(bytAr)
}

//get balance of only corporate
func (s *SmartContract) getBalanceCorporate(APIstub shim.ChaincodeStubInterface,orgName string) pb.Response {
	logger.Info("*************** getBalanceCorporate Started ***************")

	allBalances := make(map[string]float64)
	amount := 0.0

	tokenBalanceAsBytes, _ := APIstub.GetState(orgName)
	snapshotBalanceAsBytes, _ := APIstub.GetState(orgName + "_snapshot")

	//fetch all escrow funds
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"corporate\": \"%s\"}}", orgName)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	logger.Info("query result:", string(queryResults))

	var result []map[string]interface{}
	err = json.Unmarshal([]byte(queryResults), &result)

	for _, value := range result {
		for _, fundObj := range value["Record"].(map[string]interface{})["funds"].([]interface{}) {
			amount += fundObj.(map[string]interface{})["qty"].(float64)
		}
	}

	if amount > 0.0 {
		allBalances["escrowBalance"] = amount
	}
	if tokenBalanceAsBytes != nil {
		amount, _ = strconv.ParseFloat(string(tokenBalanceAsBytes), 64)
		allBalances["balance"] = amount
	}
	if snapshotBalanceAsBytes != nil {
		amount, _ = strconv.ParseFloat(string(snapshotBalanceAsBytes), 64)
		allBalances["snapshotBalance"] = amount
	}

	balJSON, _ := json.Marshal(allBalances)
	jsonStr := string(balJSON)
	logger.Info("*************** getBalanceCorporate Successfull ***************")
	return shim.Success([]byte(jsonStr))
}

func (s *SmartContract) generalQueryFunction(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** generalQueryFunction Started ***************")

	queryString := args[0]
	
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** generalQueryFunction Successfull ***************")
	return shim.Success(queryResults)
}

//General pagination query
func (s *SmartContract) generalQueryFunctionPagination(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** generalQueryFunctionPagination Started ***************")

	//   0
	// "queryString"
	if len(args) < 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	}

	queryString := args[0]
	//return type of ParseInt is int64
	pageSize, err := strconv.ParseInt(args[1], 10, 32)
	if err != nil {
		return shim.Error(err.Error())
	}
	bookmark := args[2]

	queryResults, err := getQueryResultForQueryStringWithPagination(APIstub, queryString, int32(pageSize), bookmark)
	if err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(queryResults)

	logger.Info("*************** generalQueryFunctionPagination Successfull ***************")
	return shim.Success(queryResults)
}

// =========================================================================================
// getQueryResultForQueryStringWithPagination executes the passed in query string with
// pagination info. Result set is built and returned as a byte array containing the JSON results.
// =========================================================================================
func getQueryResultForQueryStringWithPagination(stub shim.ChaincodeStubInterface, queryString string, pageSize int32, bookmark string) ([]byte, error) {

	fmt.Printf("- getQueryResultForQueryString queryString:\n%s\n", queryString)

	resultsIterator, responseMetadata, err := stub.GetQueryResultWithPagination(queryString, pageSize, bookmark)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	buffer, err := constructQueryResponseFromIterator(resultsIterator)
	if err != nil {
		return nil, err
	}

	bufferWithPaginationInfo := addPaginationMetadataToQueryResults(buffer, responseMetadata)

	fmt.Printf("- getQueryResultForQueryString queryResult:\n%s\n", bufferWithPaginationInfo.String())

	return buffer.Bytes(), nil
}

// ===========================================================================================
// addPaginationMetadataToQueryResults adds QueryResponseMetadata, which contains pagination
// info, to the constructed query results
// ===========================================================================================
func addPaginationMetadataToQueryResults(buffer *bytes.Buffer, responseMetadata *pb.QueryResponseMetadata) *bytes.Buffer {

	buffer.WriteString("#[{\"ResponseMetadata\":{\"RecordsCount\":")
	buffer.WriteString("\"")
	buffer.WriteString(fmt.Sprintf("%v", responseMetadata.FetchedRecordsCount))
	buffer.WriteString("\"")
	buffer.WriteString(", \"Bookmark\":")
	buffer.WriteString("\"")
	buffer.WriteString(responseMetadata.Bookmark)
	buffer.WriteString("\"}}]")

	return buffer
}

func (s *SmartContract) getAllCorporates(APIstub shim.ChaincodeStubInterface) pb.Response {
	logger.Info("*************** getAllCorporates Started ***************")

	corporatesBytes, _ := APIstub.GetState("corporates")

	logger.Info("*************** getAllCorporates Successfull ***************")
	return shim.Success(corporatesBytes)
}