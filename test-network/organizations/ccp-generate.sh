#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${ORGC}/$2/" \
		-e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${ORGC}/$2/" \
		-e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        organizations/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=corporate
ORGC=Corporate
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/corporate.csr.com/tlsca/tlsca.corporate.csr.com-cert.pem
CAPEM=organizations/peerOrganizations/corporate.csr.com/ca/ca.corporate.csr.com-cert.pem

echo "$(json_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/corporate.csr.com/connection-corporate.json
echo "$(yaml_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/corporate.csr.com/connection-corporate.yaml

ORG=creditsauthority
ORGC=CreditsAuthority
P0PORT=9051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/creditsauthority.csr.com/tlsca/tlsca.creditsauthority.csr.com-cert.pem
CAPEM=organizations/peerOrganizations/creditsauthority.csr.com/ca/ca.creditsauthority.csr.com-cert.pem

echo "$(json_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/creditsauthority.csr.com/connection-creditsauthority.json
echo "$(yaml_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/creditsauthority.csr.com/connection-creditsauthority.yaml


ORG=ngo
ORGC=Ngo
P0PORT=11051
CAPORT=9054
PEERPEM=organizations/peerOrganizations/ngo.csr.com/tlsca/tlsca.ngo.csr.com-cert.pem
CAPEM=organizations/peerOrganizations/ngo.csr.com/ca/ca.ngo.csr.com-cert.pem

echo "$(json_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ngo.csr.com/connection-ngo.json
echo "$(yaml_ccp $ORG $ORGC $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/ngo.csr.com/connection-ngo.yaml
