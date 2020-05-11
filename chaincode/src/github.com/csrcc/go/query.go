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
		queryString := "{\"selector\":{\"docType\":\"Transaction\",\"txType\":\"AssignToken\",\"to\":\"" + org + "\"},\"fields\":[\"qty\"]}"
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

//query
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

//query
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

//query
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

//query
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

//query
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

//query
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
