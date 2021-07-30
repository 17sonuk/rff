# CSR - Rainforest Blockchain

### System Requirments

1. Ubuntu OS v20.04 LTS
1. 4 GB RAM
1. 32 GB HDD/SSD
1. or create a 'T2 Medium' EC2 instance with above configurations.

### SetUp Steps

1. Hyperledger Fabric network setup
1. API app setup
   1. Install nvm. Follow the command output to fully complete the installation.
      ```
      curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.0/install.sh | bash
      ```
   1. Install Node v12.13.1. It also installs a compatible npm version.
      ```
      nvm install 12.13.1
      ```
   1. Install build essentials for Ubuntu.
      ```
      sudo apt-get update
      sudo apt-get install build-essential
      ```
   1. Start a docker container for mongoDB.
      ```
      docker run -d -p 27017:27017 --name mongodb -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=password mongo
      ```
   1. Check if MongoDB admin password has been set using below commands.
      ```
      //enter into the mongodb container
      docker exec -it mongodb bash
      //enter into mongo shell
      mongo
      //switch to admin
      > use admin
      //authenticate with admin password
      > db.auth("admin", passwordPrompt())
      //list the databases
      > show dbs
      // exit mongo shell and container using exit cmd
      ```
   1. Prepare a file named .env in CSR_Express folder. Use CSR_Express/example.env file for reference and add the variables accordingly.
   1. Update the ccp connection file path in all files of CSR_Express/fabric-sdk folder.
   1. Go to CSR_Express folder and install all npm dependencies.
      ```
      npm install
      ```
   1. Install pm2.
      ```
      npm install pm2 -g
      ```
   1. Run the app from CSR_Express folder.
      ```
      pm2 start index.js --name app
      ```
