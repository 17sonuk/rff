package main

import (
	"encoding/json"
	// "fmt"
	// "strconv"
	// "strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

// type ItData struct {
// 	ObjectType  string            `json:"itData"`
// 	Year      	map[string][]Pan  `json:"year"`
// }

type Liability struct {
	ObjectType     string   `json:"objectType"`
	PanNumber      string   `json:"panNumber"`
	CorporateName  string   `json:"corporateName"`
	TotalLiability float64  `json:"totalLiability"`
}

//save/update IT Data(i.e CSR liability of corporates)
func (s *SmartContract) saveItData(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** saveItData Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	// if mspId != "CreditsAuthorityMSP" || commonName != "itdept" {
	// 	logger.Info("only creditsauthority's IT dept can initiate saveItData")
	// 	return shim.Error("only creditsauthority's IT dept can initiate saveItData")
	// }
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return shim.Error("year must be a non-empty json string")
	} else if len(args[1]) <= 2 {
		return shim.Error("liability details must be a non-empty json list")
	}

	year := args[0]

	liabilities := []Liability{}
	logger.Info("before unmarshall")
	err = json.Unmarshal([]byte(args[1]), &liabilities)

	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	} else if len(liabilities) <= 0 {
		return shim.Error("liability details must be a non-empty list!")
	} 
	
	corporatePanBytes, _ := APIstub.GetState("corporatePan")
	corporatePan := make(map[string]string)
	err = json.Unmarshal(corporatePanBytes, &corporatePan)

	for index, _ := range liabilities {
		liabilities[index].ObjectType = "Liability"
		if len(liabilities[index].CorporateName) < 1 {
			return shim.Error("Corporate name is mandatory!")
		} else if liabilities[index].TotalLiability < 0.0 {
			return shim.Error("Total liability is invalid!")
		} else if len(liabilities[index].PanNumber) < 1 {
			return shim.Error("Pan Number is mandatory!")
		} else if len(corporatePan[liabilities[index].PanNumber]) > 0 {
			liabilities[index].CorporateName = corporatePan[liabilities[index].PanNumber]
		}
	}

	liabilityBytes, err := json.Marshal(liabilities)
	if err != nil {
		return shim.Error("error in marshalling: " + err.Error())
	}
	APIstub.PutState(year, liabilityBytes)
	
	logger.Info("*************** saveItData Successful ***************")
	return shim.Success(nil)
}
