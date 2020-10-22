package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric/protos/msp"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Transaction struct {
	ObjectType  string  `json:"docType"`
	From        string  `json:"from"`
	To          string  `json:"to"`
	Qty         float64 `json:"qty"`
	Date        int     `json:"date"`
	TxType      string  `json:"txType"`
	ObjRef      string  `json:"objRef"`
	PhaseNumber int     `json:"phaseNumber"`
}

type Notification struct {
	TxId        string   `json:"txId"`
	Description string   `json:"description"`
	Users       []string `json:"users"`
}

// Contains tells whether a contains x.
func contains(a []string, x string) bool {
	for _, n := range a {
		if x == n {
			return true
		}
	}
	return false
}

//get all corporates
func getCorporates(APIstub shim.ChaincodeStubInterface) []string {

	//Get corporate list
	corporatesBytes, _ := APIstub.GetState("corporates")
	corporates := []string{}

	if corporatesBytes != nil {
		json.Unmarshal(corporatesBytes, &corporates)
		// if err != nil {
		// 	return shim.Error(err.Error())
		// }
	}
	return corporates
}

//add a new Tx to the ledger
func createTransaction(APIstub shim.ChaincodeStubInterface, fromAddress string, toAddress string, quantity float64, timestamp int, transactionType string, objRef string, txId string, phaseNumber int) error {

	txObjAsBytes, _ := APIstub.GetState(txId)
	if txObjAsBytes != nil {
		return fmt.Errorf("tx id already exists")
	}
	newTx := &Transaction{ObjectType: "Transaction", From: fromAddress, To: toAddress, Qty: quantity, Date: timestamp, TxType: transactionType, ObjRef: objRef, PhaseNumber: phaseNumber}
	txInBytes, _ := json.Marshal(newTx)

	//save the tx
	return APIstub.PutState(txId, txInBytes)
}

//get loggedin user info
func getTxCreatorInfo(creator []byte) (string, string, error) {

	var certASN1 *pem.Block
	var cert *x509.Certificate
	var err error

	creatorSerializedId := &msp.SerializedIdentity{}
	err = proto.Unmarshal(creator, creatorSerializedId)
	if err != nil {
		fmt.Printf("Error unmarshalling creator identity: " + err.Error())
		return "", "", err
	}

	if len(creatorSerializedId.IdBytes) == 0 {
		return "", "", errors.New("Empty certificate")
	}
	certASN1, _ = pem.Decode(creatorSerializedId.IdBytes)
	cert, err = x509.ParseCertificate(certASN1.Bytes)

	if err != nil {
		return "", "", err
	}
	return creatorSerializedId.Mspid, cert.Subject.CommonName + "." + cert.Issuer.Organization[0], nil
}

//generate query string
func gqs(a []string) string {
	res := "{\"selector\":{"

	for i := 0; i < len(a); i = i + 2 {
		res = res + "\"" + a[i] + "\":\"" + a[i+1] + "\""
		if i != len(a)-2 {
			logger.Info(i)
			res = res + ","
		}
	}
	return res + "}}"
}

// add a corporate with PAN number
func (s *SmartContract) addCorporatePan(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** addCorporatePan Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	// if mspId != "CreditsAuthorityMSP" || commonName != "ca" {
	// 	logger.Info("only creditsauthority can initiate addCorporatePan")
	// 	return shim.Error("only creditsauthority can initiate addCorporatePan")
	// }
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 2 {
		return shim.Error("Incorrect number of arguments. Expecting 2")
	} else if len(args[0]) <= 0 {
		return shim.Error("pan number must be non-empty")
	} else if len(args[1]) <= 0 {
		return shim.Error("corporate name must be non-empty")
	}

	pan := args[0]
	corpName := args[1]

	// set corporatePan map
	corporatePanBytes, _ := APIstub.GetState("corporatePan")
	corporatePan := make(map[string]string)

	if corporatePanBytes != nil {
		json.Unmarshal(corporatePanBytes, &corporatePan)
	} 
	if len(corporatePan[pan]) > 0 {
		return shim.Error("This pan already exists")
	}
	corporatePan[pan] = corpName

	corporatePanBytes, err = json.Marshal(corporatePan)
	if err != nil {
		return shim.Error("error in marshalling: " + err.Error())
	}

	APIstub.PutState("corporatePan", corporatePanBytes)

	logger.Info("*************** addCorporatePan Successfull ***************")
	return shim.Success(nil)
}
