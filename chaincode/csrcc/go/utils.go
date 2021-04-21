package main

import (
	"crypto/x509"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/golang/protobuf/proto"
	// "github.com/hyperledger/fabric/protos/msp"

	"github.com/hyperledger/fabric-protos-go/msp"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
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

//generate query string
func gqs(a []string) string {
	res := "{\"selector\":{"

	for i := 0; i < len(a); i = i + 2 {
		res = res + "\"" + a[i] + "\":\"" + a[i+1] + "\""
		if i != len(a)-2 {
			//InfoLogger.Printf(i)
			res = res + ","
		}
	}
	return res + "}}"
}

//get all corporates
func getCorporates(ctx contractapi.TransactionContextInterface) []string {

	//Get corporate list
	corporatesBytes, _ := ctx.GetStub().GetState("corporates")
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
func createTransaction(ctx contractapi.TransactionContextInterface, fromAddress string, toAddress string, quantity float64, timestamp int, transactionType string, objRef string, txId string, phaseNumber int) error {

	txObjAsBytes, _ := ctx.GetStub().GetState(txId)
	if txObjAsBytes != nil {
		return fmt.Errorf("tx id already exists")
	}

	newTx := &Transaction{
		ObjectType:  "Transaction",
		From:        fromAddress,
		To:          toAddress,
		Qty:         quantity,
		Date:        timestamp,
		TxType:      transactionType,
		ObjRef:      objRef,
		PhaseNumber: phaseNumber,
	}
	txInBytes, _ := json.Marshal(newTx)

	//save the tx
	return ctx.GetStub().PutState(txId, txInBytes)
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
