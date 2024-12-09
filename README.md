# Jutsu Hub

Jutsu Hub is a solidity smart contract component registry.
Developed by [Ame Network](https://ame.network/). All solidity developers can share and use these components, and use it to manage and interact with contract projects.


It consists of three parts:
- Jutsu CLI, a command line tool that you can use to create, install, and publish solidity components.
- JutsuHub, a website for viewing published component details.
- Jutsu registry contract, deployed on OP Network mainnet, used to record component information.


### Install
`
npm install jutsu-cli -g 
`

### Create a new component  
`
jutsu new <project name>
`

**Project file directory**   
  ├ src/   
  ├ .env   
  ├ config.json   
  ├ .gitignore   
  └ README.md 


**src**  
This folder saves your solidity contract files


**.env**s 
```

#This is a randomly generated wallet
WALLET_ADDRESS=<Wallet Address>
WALLET_PRIVATE_KEY=<Wallet Private Key>

#Please configure your local network    
CUSTOM_RPC=http://127.0.0.1:8545 

#Please register pinata https://pinata.cloud/
PINATA_JWT=<Pinata jwt>

```

The Pinata API JWT key that is used for uploading Solidity projects to IPFS.  
[How to register and use pinata jwt](https://docs.pinata.cloud/account-management/api-keys)
 

**config.json**
```
{
  "name": "your project name",
  "description": "a brief introduction",
  "version": "version number",
  "license": "open source license", 
  "github": "github link"
}
```

### Deploy Contract ###
`
jutsu deploy <file path>  -a <params> -n <RPC name configured in the .env>`
`   
 
example:  
`jutsu deploy ./src/Test.sol  -a "alice" 18 -n CUSTOM_RPC`


### Add Component ###
`jutsu add <packagename>@<version number>`

example:   
`jutsu add ame@1.0.0`


### Release Component ###
`jutsu publish`  
Your contract project files will be published to IPFS.
Please make sure the wallet configured in your .env file contains a small amount of OP Mainnet ETH to pay the gas fee.




