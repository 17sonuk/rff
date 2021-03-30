
#!/bin/bash
export IMAGE_TAG=latest
export COMPOSE_PROJECT_NAME=net
export SYS_CHANNEL=byfn-sys-channel

CHANNEL_NAME="csrchannel"

function printhelp(){
    echo "Allowed Commands"
    echo './csr.sh up'
    echo './csr.sh down'
    echo './csr.sh start'
    echo './csr.sh stop'
    echo './csr.sh createchannel'
    echo './csr.sh upgradeChaincode'
}

function networkdown(){
    # CONTAINER_IDS=$(docker ps -aq)
    # docker rm -f $CONTAINER_IDS
    docker container prune -f
    docker volume prune -f
    docker network prune -f
    docker system  prune -f

    docker-compose -f docker-compose-ca.yaml -f docker-compose-e2e.yaml -f docker-compose-couch.yaml down --volumes --remove-orphans
} 

function networkstop(){
    docker-compose -f docker-compose-ca.yaml -f docker-compose-e2e.yaml -f docker-compose-couch.yaml stop
} 

function networkstart(){
    export CORPORATE_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/corporate.csr.com/ca && ls *_sk)
    export CREDITS_AUTHORITY_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/creditsauthority.csr.com/ca && ls *_sk)
    export NGO_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/ngo.csr.com/ca && ls *_sk)

    echo 'CORPORATE_PRIVATE_KEY-' $CORPORATE_PRIVATE_KEY
    echo 'CREDITS_AUTHORITY_PRIVATE_KEY-' $CREDITS_AUTHORITY_PRIVATE_KEY
    echo 'NGO_PRIVATE_KEY-' $NGO_PRIVATE_KEY

    docker-compose -f docker-compose-ca.yaml -f docker-compose-e2e.yaml -f docker-compose-couch.yaml start
}

function networkup(){
    rm -rf crypto-config/
    rm -f channel-artifacts/*
    ../bin/cryptogen generate --config=./crypto-config.yaml
    ../bin/configtxgen -profile FiveOrgsCsrOrdererGenesis -channelID byfn-sys-channel -outputBlock ./channel-artifacts/genesis.block
    ../bin/configtxgen -profile FiveOrgsCsrChannel  -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID csrchannel
    ../bin/configtxgen -profile FiveOrgsCsrChannel -outputAnchorPeersUpdate ./channel-artifacts/CorporateMSPanchors.tx -channelID csrchannel -asOrg CorporateMSP
    ../bin/configtxgen -profile FiveOrgsCsrChannel -outputAnchorPeersUpdate ./channel-artifacts/CreditsAuthorityMSPanchors.tx -channelID csrchannel -asOrg CreditsAuthorityMSP
    ../bin/configtxgen -profile FiveOrgsCsrChannel -outputAnchorPeersUpdate ./channel-artifacts/NgoMSPanchors.tx -channelID csrchannel -asOrg NgoMSP

    export CORPORATE_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/corporate.csr.com/ca && ls *_sk)
    export CREDITS_AUTHORITY_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/creditsauthority.csr.com/ca && ls *_sk)
    export NGO_PRIVATE_KEY=$(cd crypto-config/peerOrganizations/ngo.csr.com/ca && ls *_sk)

    echo 'CORPORATE_PRIVATE_KEY-' $CORPORATE_PRIVATE_KEY
    echo 'CREDITS_AUTHORITY_PRIVATE_KEY-' $CREDITS_AUTHORITY_PRIVATE_KEY
    echo 'NGO_PRIVATE_KEY-' $NGO_PRIVATE_KEY

    docker-compose -f docker-compose-ca.yaml -f docker-compose-e2e.yaml -f docker-compose-couch.yaml up -d
}

function createchannel(){
    echo "calling cli"
    docker exec cli chmod 0777 -R scripts && docker exec cli scripts/script.sh $1 $2
}

if [ "$1" == "down" ]; then 
    networkdown
elif [ "$1" == "up" ]; then 
    networkup
elif [ "$1" == "stop" ]; then
    networkstop
elif [ "$1" == "start" ]; then 
    networkstart
elif [ "$1" == "createchannel" ]; then 
    echo enter chaincode name 
    read chaincode
    echo enter chaincode version
    read chaincode_version 
    createchannel $chaincode $chaincode_version
elif [ "$1" == "upgradeChaincode" ]; then 
    echo enter chaincode name 
    read chaincode
    echo enter chaincode version
    read chaincode_version
    createchannel $chaincode $chaincode_version
else 
    printhelp
    exit 1
fi