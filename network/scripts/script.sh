#!/bin/bash
CHANNEL_NAME="csrchannel"
DELAY=3
COUNTER=1
MAX_RETRY=10
LANGUAGE=golang
CC_SRC_PATH=github.com/chaincode/
CHAINCODE=$1
VERSION=$2

: ${CHAINCODE:="csrcc"}

. scripts/utils.sh

createchannel () {
    set -x
    setGlobals 0 1
    echo $ORDERER_CA
    peer channel create -o orderer.csr.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls --cafile $ORDERER_CA >&log.txt
    cat log.txt
    set +x
}

joinchannel () {
	for org in Corporate CreditsAuthority Ngo; do
	    for peer in 0 1 ; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	    done
	done
}

createchannel
joinchannel

updateAnchorPeers 0 Corporate
updateAnchorPeers 0 CreditsAuthority
updateAnchorPeers 0 Ngo

echo chaincode name is $CHAINCODE
echo chaincode version is $VERSION 

# installChaincode 0 Corporate $CHAINCODE $VERSION
# installChaincode 0 CreditsAuthority $CHAINCODE $VERSION
# installChaincode 0 Ngo $CHAINCODE $VERSION

instantiateChaincode 0 Corporate $CHAINCODE $VERSION
# upgradeChaincode 0 Corporate $CHAINCODE $VERSION 
