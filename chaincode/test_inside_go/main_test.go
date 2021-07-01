package main

import (
	"testing"

	"github.com/hyperledger/fabric/core/chaincode/shim"

	"github.com/stretchr/testify/require"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"

	"csr-aws-git/csr/chaincode"

	"github.com/hyperledger/fabric-samples/tree/v2.2.2/asset-transfer-basic/chaincode-go/chaincode/mocks"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode"
	// "github.com/hyperledger/fabric-samples/asset-transfer-basic/chaincode-go/chaincode/mocks"
)

//go:generate counterfeiter -o mocks/transaction.go -fake-name TransactionContext . transactionContext
type transactionContext interface {
	contractapi.TransactionContextInterface
}

//go:generate counterfeiter -o mocks/chaincodestub.go -fake-name ChaincodeStub . chaincodeStub
type chaincodeStub interface {
	shim.ChaincodeStubInterface
}

//go:generate counterfeiter -o mocks/statequeryiterator.go -fake-name StateQueryIterator . stateQueryIterator
type stateQueryIterator interface {
	shim.StateQueryIteratorInterface
}

func TestInitLedger(test *testing.T) {

	chaincodeStub := &mocks.ChaincodeStub{}
	transactionContext := &mocks.TransactionContext{}
	transactionContext.GetStubReturns(chaincodeStub)

	csr := chaincode.SmartContract{}
	err := csr.InitLedger(transactionContext)
	require.NoError(test, err)

	// cc := new(SmartContract.SmartContract)
	// stubs := shimtest.NewMockStub("rff", cc)
	// res := stubs.MockInit("1", [][]byte{[]byte("a"), []byte("10"), []byte("10")})
	// if res.Status != shim.OK {
	// 	fmt.Println("InitLedger failed", string(res.Message))
	// 	test.FailNow()
	// }
}
