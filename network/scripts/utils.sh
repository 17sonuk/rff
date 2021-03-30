ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp/tlscacerts/tlsca.csr.com-cert.pem
PEER0_CORPORATE_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/ca.crt
PEER0_CREDITSAUTHORTY_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/ca.crt
PEER0_NGO_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/ca.crt

setOrdererGlobals(){
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp/tlscacerts/tlsca.csr.com-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/csr.com/users/Admin@csr.com/msp
}

verifyResult(){
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute End-2-End Scenario ==========="
    echo
    exit 1
  fi
}

setGlobals(){
  PEER=$1
  ORG=$2
  if [ "$ORG" == "Corporate" ]; then
    CORE_PEER_LOCALMSPID="CorporateMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_CORPORATE_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/corporate.csr.com/users/Admin@corporate.csr.com/msp
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.corporate.csr.com:7051
    else
      CORE_PEER_ADDRESS=peer1.corporate.csr.com:8051
    fi
  elif [ "$ORG" == "CreditsAuthority" ]; then
    CORE_PEER_LOCALMSPID="CreditsAuthorityMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_CREDITSAUTHORTY_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/creditsauthority.csr.com/users/Admin@creditsauthority.csr.com/msp
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.creditsauthority.csr.com:9051
    else
      CORE_PEER_ADDRESS=peer1.creditsauthority.csr.com:10051
    fi

  elif [ "$ORG" == "Ngo" ]; then
    CORE_PEER_LOCALMSPID="NgoMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_NGO_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/ngo.csr.com/users/Admin@ngo.csr.com/msp
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.ngo.csr.com:11051
    else
      CORE_PEER_ADDRESS=peer1.ngo.csr.com:12051
    fi
  else
    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

joinChannelWithRetry(){
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG

  set -x
  peer channel join -b $CHANNEL_NAME.block >&log.txt
  res=$?
  set +x
  cat log.txt
  if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
    COUNTER=$(expr $COUNTER + 1)
    echo "peer${PEER}.org${ORG} failed to join the channel, Retry after $DELAY seconds"
    sleep $DELAY
    joinChannelWithRetry $PEER $ORG
  else
    COUNTER=1
  fi
  verifyResult $res "After $MAX_RETRY attempts, peer${PEER}.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

updateAnchorPeers(){
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG

  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel update -o orderer.csr.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel update -o orderer.csr.com:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

installChaincode(){
  PEER=$1
  ORG=$2
  CHAINCODE=$3
  VERSION=$4
  setGlobals $PEER $ORG
  set -x
  peer chaincode install -n $CHAINCODE -v $VERSION -l ${LANGUAGE} -p ${CC_SRC_PATH} >&log.txt
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode installation on peer${PEER}.org${ORG} has failed"
  echo "===================== Chaincode is installed on peer${PEER}.org${ORG} ===================== "
  echo
}

instantiateChaincode(){
  PEER=$1
  ORG=$2
  CHAINCODE=$3
  VERSION=$4
  setGlobals $PEER $ORG
  
  set -x
  peer chaincode instantiate -o orderer.csr.com:7050 --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n $CHAINCODE -v $VERSION -c '{"Args":["Init"]}' -P "AND ('CorporateMSP.peer','CreditsAuthorityMSP.peer','NgoMSP.peer')" >&log.txt
  res=$?
  set +x
  
  cat log.txt
  verifyResult $res "Chaincode instantiation on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

upgradeChaincode(){
  PEER=$1
  ORG=$2
  CHAINCODE=$3
  VERSION=$4
  setGlobals $PEER $ORG
  
  set -x
  peer chaincode upgrade -o orderer.csr.com:7050 --tls --cafile $ORDERER_CA -C $CHANNEL_NAME -n $CHAINCODE -v $VERSION -c '{"Args":["Init"]}' -P "AND ('CorporateMSP.peer','CreditsAuthorityMSP.peer','NgoMSP.peer')" >&log.txt
  res=$?
  set +x
  
  cat log.txt
  verifyResult $res "Chaincode upgrade on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is upgraded on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}