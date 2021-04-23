package main

import (
	"encoding/json"
	"fmt"

	// "strconv"
	// "strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// type ItData struct {
// 	ObjectType  string            `json:"itData"`
// 	Year      	map[string][]Pan  `json:"year"`
// }

type Liability struct {
	ObjectType     string  `json:"objectType"`
	PanNumber      string  `json:"panNumber"`
	CorporateName  string  `json:"corporateName"`
	TotalLiability float64 `json:"totalLiability"`
}

//save/update IT Data(i.e CSR liability of corporates)
func (s *SmartContract) SaveItData(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** saveItData Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	// if mspId != "CreditsAuthorityMSP" || commonName != "itdept" {
	// 	InfoLogger.Printf("only creditsauthority's IT dept can initiate saveItData")
	// 	return false, fmt.Errorf("only creditsauthority's IT dept can initiate saveItData")
	// }
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 2 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("year must be a non-empty json string")
	} else if len(args[1]) <= 2 {
		return false, fmt.Errorf("liability details must be a non-empty json list")
	}

	year := args[0]

	liabilities := []Liability{}
	InfoLogger.Printf("before unmarshall")
	err = json.Unmarshal([]byte(args[1]), &liabilities)

	if err != nil {
		return false, fmt.Errorf("error in unmarshalling: " + err.Error())
	} else if len(liabilities) <= 0 {
		return false, fmt.Errorf("liability details must be a non-empty list!")
	}

	corporatePanBytes, _ := ctx.GetStub().GetState("corporatePan")
	corporatePan := make(map[string]string)
	err = json.Unmarshal(corporatePanBytes, &corporatePan)

	for index, _ := range liabilities {
		liabilities[index].ObjectType = "Liability"
		if len(liabilities[index].CorporateName) < 1 {
			return false, fmt.Errorf("Corporate name is mandatory!")
		} else if liabilities[index].TotalLiability < 0.0 {
			return false, fmt.Errorf("Total liability is invalid!")
		} else if len(liabilities[index].PanNumber) < 1 {
			return false, fmt.Errorf("Pan Number is mandatory!")
		} else if len(corporatePan[liabilities[index].PanNumber]) > 0 {
			liabilities[index].CorporateName = corporatePan[liabilities[index].PanNumber]
		}
	}

	liabilityBytes, err := json.Marshal(liabilities)
	if err != nil {
		return false, fmt.Errorf("error in marshalling: " + err.Error())
	}
	ctx.GetStub().PutState(year, liabilityBytes)

	InfoLogger.Printf("*************** saveItData Successful ***************")
	return true, nil
}