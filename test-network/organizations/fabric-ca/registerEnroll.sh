#!/bin/bash

function createCorporate() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/corporate.csr.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/corporate.csr.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-corporate --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-corporate.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-corporate.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-corporate.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-corporate.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-corporate --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null
  
   infoln "Registering peer1"
  set -x
  fabric-ca-client register --caname ca-corporate --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-corporate --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-corporate --id.name corporateadmin --id.secret corporateadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/msp --csr.hosts peer0.corporate.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/msp/config.yaml

 infoln "Generating the peer1 msp"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/msp --csr.hosts peer1.corporate.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/msp/config.yaml


  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls --enrollment.profile tls --csr.hosts peer0.corporate.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/tlsca/tlsca.corporate.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer0.corporate.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/ca/ca.corporate.csr.com-cert.pem

  infoln "Generating the peer1-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls --enrollment.profile tls --csr.hosts peer1.corporate.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/tlsca/tlsca.corporate.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/corporate.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/peers/peer1.corporate.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/corporate.csr.com/ca/ca.corporate.csr.com-cert.pem


  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/users/User1@corporate.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/corporate.csr.com/users/User1@corporate.csr.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://corporateadmin:corporateadminpw@localhost:7054 --caname ca-corporate -M ${PWD}/organizations/peerOrganizations/corporate.csr.com/users/Admin@corporate.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/corporate/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/corporate.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/corporate.csr.com/users/Admin@corporate.csr.com/msp/config.yaml
}

function createCreditsAuthority() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/creditsauthority.csr.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-creditsauthority --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-creditsauthority.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-creditsauthority.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-creditsauthority.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-creditsauthority.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-creditsauthority --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null
  
   infoln "Registering peer1"
  set -x
  fabric-ca-client register --caname ca-creditsauthority --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-creditsauthority --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-creditsauthority --id.name creditsauthorityadmin --id.secret creditsauthorityadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/msp --csr.hosts peer0.creditsauthority.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/msp/config.yaml

  infoln "Generating the peer1 msp"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/msp --csr.hosts peer1.creditsauthority.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/msp/config.yaml

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls --enrollment.profile tls --csr.hosts peer0.creditsauthority.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/tlsca/tlsca.creditsauthority.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer0.creditsauthority.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/ca/ca.creditsauthority.csr.com-cert.pem

  infoln "Generating the peer1-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls --enrollment.profile tls --csr.hosts peer1.creditsauthority.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/tlsca/tlsca.creditsauthority.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/peers/peer1.creditsauthority.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/ca/ca.creditsauthority.csr.com-cert.pem


  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/users/User1@creditsauthority.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/users/User1@creditsauthority.csr.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://creditsauthorityadmin:creditsauthorityadminpw@localhost:8054 --caname ca-creditsauthority -M ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/users/Admin@creditsauthority.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/creditsauthority/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/creditsauthority.csr.com/users/Admin@creditsauthority.csr.com/msp/config.yaml
}

function createNgo() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/ngo.csr.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/ngo.csr.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-ngo --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-ngo.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-ngo.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-ngo.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-ngo.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/config.yaml

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-ngo --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null
  
  infoln "Registering peer1"
  set -x
  fabric-ca-client register --caname ca-ngo --id.name peer1 --id.secret peer1pw --id.type peer --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-ngo --id.name user1 --id.secret user1pw --id.type client --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-ngo --id.name ngoadmin --id.secret ngoadminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/msp --csr.hosts peer0.ngo.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/msp/config.yaml

  infoln "Generating the peer1 msp"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/msp --csr.hosts peer1.ngo.csr.com --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/msp/config.yaml


  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls --enrollment.profile tls --csr.hosts peer0.ngo.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/tlsca/tlsca.ngo.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer0.ngo.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/ca/ca.ngo.csr.com-cert.pem

  infoln "Generating the peer1-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer1:peer1pw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls --enrollment.profile tls --csr.hosts peer1.ngo.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/ca.crt
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/signcerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/server.crt
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/keystore/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/tlscacerts/ca.crt

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/tlsca
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/tls/tlscacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/tlsca/tlsca.ngo.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/peerOrganizations/ngo.csr.com/ca
  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/peers/peer1.ngo.csr.com/msp/cacerts/* ${PWD}/organizations/peerOrganizations/ngo.csr.com/ca/ca.ngo.csr.com-cert.pem


  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/users/User1@ngo.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/ngo.csr.com/users/User1@ngo.csr.com/msp/config.yaml

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://ngoadmin:ngoadminpw@localhost:9054 --caname ca-ngo -M ${PWD}/organizations/peerOrganizations/ngo.csr.com/users/Admin@ngo.csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/ngo/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/peerOrganizations/ngo.csr.com/msp/config.yaml ${PWD}/organizations/peerOrganizations/ngo.csr.com/users/Admin@ngo.csr.com/msp/config.yaml
}


function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/csr.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/csr.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:10054 --caname ca-orderer --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-10054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' >${PWD}/organizations/ordererOrganizations/csr.com/msp/config.yaml

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:10054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp --csr.hosts orderer.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/csr.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp/config.yaml

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:10054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls --enrollment.profile tls --csr.hosts orderer.csr.com --csr.hosts localhost --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/ca.crt
  cp ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/signcerts/* ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/server.crt
  cp ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/keystore/* ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/server.key

  mkdir -p ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/msp/tlscacerts/tlsca.csr.com-cert.pem

  mkdir -p ${PWD}/organizations/ordererOrganizations/csr.com/msp/tlscacerts
  cp ${PWD}/organizations/ordererOrganizations/csr.com/orderers/orderer.csr.com/tls/tlscacerts/* ${PWD}/organizations/ordererOrganizations/csr.com/msp/tlscacerts/tlsca.csr.com-cert.pem

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:10054 --caname ca-orderer -M ${PWD}/organizations/ordererOrganizations/csr.com/users/Admin@csr.com/msp --tls.certfiles ${PWD}/organizations/fabric-ca/orderer/tls-cert.pem
  { set +x; } 2>/dev/null

  cp ${PWD}/organizations/ordererOrganizations/csr.com/msp/config.yaml ${PWD}/organizations/ordererOrganizations/csr.com/users/Admin@csr.com/msp/config.yaml
}
