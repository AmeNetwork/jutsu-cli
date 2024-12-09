import fs from "fs";
import rfs from "recursive-fs";
import solc from "solc";
import path from "path";
import axios from "axios";
import clc from "cli-color";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
// import { createSpinner } from "nanospinner";
import { createHelia } from "helia";
import fse from "fs-extra";
import ora from "ora";
import { unixfs } from "@helia/unixfs";
import { PinataSDK } from "pinata-web3";
import FormData from "form-data";
import { fileTypeFromFile, fileTypeFromStream } from "file-type";
import got from "got";
import dotenv from "dotenv/config";
import Web3 from "web3"

import { AmeViem } from "ame-sdk";
// import  abi  from "ame-sdk/abi/AmeComponent.json" assert { type: "json" };;

const OPRPC = {
  id: 31337,
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
};
const PinataURL = "https://gateway.pinata.cloud/ipfs/";
const OPJutsuComponent = "0xaDA14aaF760bB06CdFF369FD47240d5352aBca63";

const copyFolder = (_sourceFolder, _destFolder) => {
  fs.mkdirSync(_destFolder, { recursive: true });
  const items = fs.readdirSync(_sourceFolder);

  items.forEach((item) => {
    const sourcePath = path.join(_sourceFolder, item);
    const destPath = path.join(_destFolder, item);
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolder(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
};

const initConfig = (_projectName) => {
  const config = `{
  "name": "${_projectName}",
  "description": "",
  "version": "1.0.0",
  "license": "ISC",
  "github": ""
}
`;
  fs.writeFileSync(_projectName + "/config.json", config);
};

const printFileStruct = (_projectName) => {
  console.log(_projectName);
  console.log("  ├─src/");
  console.log("  ├─.env");
  console.log("  ├─config.json");
  console.log("  ├─.gitignore");
  console.log("  └─README.md");
  console.log(clc.green("✨ Done"));
};

const createComponent = (_componentName) => {
  const componentCode =
    `// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0;
import "../ame/Types.sol";
import "../ame/IComponent.sol";

contract ` +
    _componentName +
    ` is IComponent {
    mapping(MethodTypes => string[]) methods;
    mapping(string => Types.Type[]) methodRequests;
    mapping(string => Types.Type[]) methodResponses;

    constructor() {}

    function get(
        string memory _methodName,
        bytes memory _methodReq
    ) public pure returns (bytes memory) {
        return abi.encode(_methodName, _methodReq);
    }

    function post(
        string memory _methodName,
        bytes memory _methodReq
    ) public payable returns (bytes memory) {
        return abi.encode(_methodName, _methodReq);
    }

    function put(
        string memory _methodName,
        bytes memory _methodReq
    ) public payable returns (bytes memory) {
        return abi.encode(_methodName, _methodReq);
    }

    function options() public pure returns (MethodTypes[] memory) {
        MethodTypes[] memory methodTypes = new MethodTypes[](4);
        methodTypes[0] = MethodTypes.GET;
        methodTypes[1] = MethodTypes.POST;
        methodTypes[2] = MethodTypes.PUT;
        methodTypes[3] = MethodTypes.OPTIONS;
        return methodTypes;
    }

    function setMethod(
        string memory _methodName,
        MethodTypes _methodType,
        Types.Type[] memory _methodReq,
        Types.Type[] memory _methodRes
    ) private {
        methods[_methodType].push(_methodName);
        methodRequests[_methodName] = _methodReq;
        methodResponses[_methodName] = _methodRes;
    }

    function getMethodReqAndRes(
        string memory _methodName
    ) public view returns (Types.Type[] memory, Types.Type[] memory) {
        return (methodRequests[_methodName], methodResponses[_methodName]);
    }

    function getMethods(
        MethodTypes _methodTypes
    ) public view returns (string[] memory) {
        return methods[_methodTypes];
    }

    function compareStrings(
        string memory _a,
        string memory _b
    ) private pure returns (bool) {
        return
            keccak256(abi.encodePacked(_a)) == keccak256(abi.encodePacked(_b));
    }
}
`;
  fs.writeFileSync("./src/" + _componentName + ".sol", componentCode);
};

const initLocal = (_projectName) => {
  const privateKey = generatePrivateKey();
  const address = privateKeyToAccount(privateKey).address;
  const env =
    `#This is a randomly generated wallet
WALLET_ADDRESS=` +
    address +
    `
WALLET_PRIVATE_KEY=` +
    privateKey +
    `
#Please configure your local network    
CUSTOM_RPC=http://127.0.0.1:8545 ` +
    `
#Please register pinata https://pinata.cloud/
PINATA_JWT=`;
  fs.writeFileSync(_projectName + "/.env", env);
};

const deploy = async (_filePath, _network, _args) => {




  if (fs.existsSync(_filePath)) {
    if (process.env.WALLET_PRIVATE_KEY != undefined) {
      const envNetwork = process.env[_network];
      if (envNetwork != undefined) {
  



        const spinner = ora({
          spinner: "dots",
          text: "deploying",
        }).start();

        var web3 = new Web3(envNetwork);
        const compiled = await compileContract(_filePath);
        web3.eth.accounts.wallet.add(process.env.WALLET_PRIVATE_KEY);
        const newContract = new web3.eth.Contract(compiled.abi);
        const deployedContract = newContract.deploy({
          data: "0x" + compiled.bytecode,
          arguments: _args,
        });
        const gas = await deployedContract.estimateGas({
          from: process.env.WALLET_ADDRESS,
        });
        const gasPrice = await web3.eth.getGasPrice();
        try {
          const tx = await deployedContract.send({
            from: process.env.WALLET_ADDRESS,
            gas,
            gasPrice: gasPrice,
          });

          spinner.clear();

          console.log(
            clc.green("deployed ") + tx.options.address
          );

          process.exit(0);

        } catch (error) {
          console.error(error);
          process.exit(0);
        }
      } else {
        console.log(
          clc.red(
            "The network was not found, please add YOUR_NETWORK_RPC=<rpc url> to the .env file"
          )
        );
      }
    } else {
      console.log(
        clc.red(
          "No available private key was found. Please add WALLET_PRIVATE_KEY=<your wallet private key> to the .env file."
        )
      );
    }
  } else {
    console.log(clc.red("File does not exist."));
  }
};

async function addContracts(contractPath, contractCodes) {
  var importRegex = /import\s+["'](.+?)["'];/g;

  var contractCode = fs.readFileSync(contractPath, "utf8");

  //Remove comment
  contractCode = contractCode.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, "");

  var importPaths = [];

  let match;
  while ((match = importRegex.exec(contractCode)) !== null) {
    importPaths.unshift(match[1]);
  }

  var contractBodyRegex =
    /(contract|interface|abstract|library).*{([^]*{[^]*})*[^]*}/s;

  var contractBody = contractCode.match(contractBodyRegex)[0];

  //Remove duplicate contracts
  if (contractCodes.includes(contractBody)) {
    var index = contractCodes.indexOf(contractBody);
    contractCodes.splice(index, 1);
    contractCodes.unshift(contractBody);
  } else {
    contractCodes.unshift(contractBody); //[contractBody].concat(contractCodes);
  }

  if (importPaths.length == 0) {
    return contractCodes;
  } else {
    for (var importPath of importPaths) {
      var absolutePath = path.resolve(path.dirname(contractPath), importPath);

      contractCodes = await addContracts(absolutePath, contractCodes);
    }

    return contractCodes;
  }
}

async function compileContract(filePath) {
  var fileInfo = path.parse(filePath);
  // {
  //   root: '',
  //   dir: './world',
  //   base: 'World.sol',
  //   ext: '.sol',
  //   name: 'World'
  // }
  var contractInfo = getContractInfo(filePath);

  var contractCodes = await addContracts(filePath, []);

  contractCodes = [
    `// SPDX-License-Identifier: ` +
      contractInfo.license +
      ` \n pragma solidity ` +
      contractInfo.version +
      `; \n`,
  ]
    .concat(contractCodes)
    .join("");

  const input = {
    language: "Solidity",
    sources: {
      [fileInfo.base]: {
        content: contractCodes,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  var compiledCode;
  try {
    compiledCode = JSON.parse(solc.compile(JSON.stringify(input)));

    const bytecode =
      compiledCode.contracts[fileInfo.base][contractInfo.name].evm.bytecode
        .object;

    const abi = compiledCode.contracts[fileInfo.base][contractInfo.name].abi;

    fs.mkdir(path.dirname(filePath) + "/abis/", { recursive: true }, () => {
      fs.writeFileSync(
        path.dirname(filePath) + "/abis/" + fileInfo.name + ".json",
        JSON.stringify(abi, null, "\t")
      );
    });

    return { bytecode, abi };
  } catch (error) {
    console.log("error", compiledCode);
  }
}

function getContractInfo(contractPath) {
  const contractCode = fs.readFileSync(contractPath, "utf8");

  const licenseRegex = /SPDX-License-Identifier:\s*(\S+)/;
  const versionRegex = /pragma solidity\s+([^\s;]+)/;

  const licenseMatch = contractCode.match(licenseRegex);
  const license = licenseMatch + licenseMatch ? licenseMatch[1] : null;

  const versionMatch = contractCode.match(versionRegex);
  const version = versionMatch ? versionMatch[1] : null;

  const contractCodeRemovedComment = contractCode.replace(
    /\/\/.*|\/\*[\s\S]*?\*\//g,
    ""
  );
  const name = contractCodeRemovedComment.match(/contract\s+(\w+)/)[1];

  return { license, version, name };
}

async function publishComponent() {
  const spinner = ora({
    spinner: "dots",
    text: "publishing",
  }).start();

  try {
    if (fs.existsSync("config.json")) {
      const config = JSON.parse(fs.readFileSync("./config.json"));
      if (
        config.name != "" &&
        config.name != undefined &&
        config.version != "" &&
        config.version != undefined
      ) {
        if (process.env.PINATA_JWT != undefined) {
          if (process.env.WALLET_PRIVATE_KEY != undefined) {
            const ameViem = new AmeViem(OPRPC, OPJutsuComponent);

            var account = privateKeyToAccount(process.env.WALLET_PRIVATE_KEY);

            var publishCheckEncode = ameViem.encodeRequestParams(
              [
                { name: "name", type: "string" },
                { name: "version", type: "string" },
                { name: "from", type: "address" },
              ],
              [config.name, config.version, account.address]
            );
            const checkResEncode = await ameViem.sendGetRequest(
              "publishCheck",
              publishCheckEncode
            );

            var publishCheckDecode = ameViem.decodeResponseData(
              [
                { name: "valid", type: "bool" },
                { name: "msg", type: "string" },
              ],
              checkResEncode
            );

            if (publishCheckDecode[0]) {
              const balance = await ameViem.publicClient.getBalance({
                address: account.address,
              });

              var estimateEncode = ameViem.encodeRequestParams(
                [
                  { name: "name", type: "string" },
                  { name: "version", type: "string" },
                  { name: "cid", type: "string" },
                ],
                [
                  config.name,
                  config.version,
                  "QmRGu24KzQ53vrNpyPJTxfS3fyaXZmsHnZfcN8MArab3i2",
                ]
              );

              const gasEstimate =
                await ameViem.publicClient.estimateContractGas({
                  address: OPJutsuComponent,
                  abi: ameViem.abi,
                  functionName: "post",
                  args: ["publishProject", estimateEncode],
                  account: account,
                });
              if (balance >= gasEstimate) {
                const ipfsRespone = await uploadFolder("./.cache", config.name);
                spinner.clear();
                const resJSON = JSON.parse(ipfsRespone.body);

                var postReqEncode = ameViem.encodeRequestParams(
                  [
                    { name: "name", type: "string" },
                    { name: "version", type: "string" },
                    { name: "ipfs", type: "string" },
                  ],
                  [config.name, config.version, resJSON.IpfsHash]
                );
                const result = await ameViem.sendPostAndPutRequest(
                  "post",
                  "publishProject",
                  postReqEncode,
                  account,
                  "0"
                );

                spinner.clear();

                console.log("IPFS Detail", resJSON);
                console.log("Transaction Detail", result);

                console.log(
                  clc.green(
                    "✔️ Successfully published " +
                      config.name +
                      "@" +
                      config.version
                  )
                );
                spinner.stop();
                process.exit(0);
              } else {
                spinner.fail(
                  clc.red(
                    "Insufficient wallet balance, please deposit some OP Mainnet ETH in your wallet to pay for gas fees."
                  )
                );
              }
            } else {
              spinner.fail(clc.red(publishCheckDecode[1]));
            }
          } else {
            spinner.fail(
              clc.red(
                "No available private key was found. Please add WALLET_PRIVATE_KEY=<your wallet private key> to the .env file."
              )
            );
          }
        } else {
          spinner.fail(
            clc.red("Please register pinata jwt https://pinata.cloud/")
          );
        }
      } else {
        spinner.fail(
          clc.red(
            "Please check whether the name and version are configured in the config.json file."
          )
        );
      }
    } else {
      spinner.fail(clc.red("config.json file not found"));
    }
  } catch (error) {
    spinner.stop();
    console.log(error);
  }
}

async function isDirectory(filepath) {
  const stats = fs.statSync(filepath);
  if (stats.isDirectory()) {
    return true;
  }
  return false;
}

async function uploadFolder(filepath, uploadName) {
  if (fs.existsSync(".cache")) {
    fs.rmSync(".cache", { recursive: true, force: true });
    fs.mkdirSync(".cache", { recursive: true });
  } else {
    fs.mkdirSync(".cache", { recursive: true });
  }
  copyFolder("./src", ".cache/src");
  fs.copyFileSync("./README.md", ".cache/README.md");
  fs.copyFileSync("./config.json", ".cache/config.json");

  let formData = new FormData();

  const directory = await isDirectory(filepath);

  if (directory) {
    const { dirs, files } = await rfs.read(filepath);

    for (const file of files) {
      const content = fs.readFileSync(file);
      formData.append(`file`, content, {
        filepath: path.join(filepath, path.relative(filepath, file)),
      });
    }
  } else {
    formData.append("file", fs.createReadStream(filepath));
  }

  var folderName = `{\n  \"name\": \"` + uploadName + `\"\n}`;
  formData.append("pinataMetadata", folderName);
  formData.append("boundary", formData._boundary);

  //eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI1OTc5OWJkZi0wNzlkLTQyYjAtYjU2ZC02M2IxYjE0NGQ5ZGUiLCJlbWFpbCI6ImhlbGxvX3JpY2tleUAxNjMuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImVjMmE2Yzc1NzFjYTM2MjI1MjYyIiwic2NvcGVkS2V5U2VjcmV0IjoiYzhjOGY1NDkyNjE1Yjc2NGQ0YzNkZTVlMzgyM2M4NDUwYTg1ZTBiYjU3OTk0NTg2NGFlYjI4OGI1MjAyOTFkOCIsImV4cCI6MTc1NzkxMjU4NH0.AjBfreZcWZKwEt8vGlP24FKemnAb2UnU0oHj8p45I_U
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const response = await got(url, {
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data; boundary=" + formData._boundary,
      Authorization: "Bearer " + process.env.PINATA_JWT,
    },
    body: formData,
  }).on("uploadProgress", (progress) => {
    if (progress.percent === 1) {
      // console.log("Pinning, please wait...");
    }
  });
  fs.rmSync(".cache", { recursive: true, force: true });

  return response;
}

async function installComponent(_componentName) {
  const spinner = ora({
    spinner: "dots",
    text: "Installing " + _componentName,
  }).start();

  var projectName = "";
  var projectVersion = "";

  if (_componentName.includes("@")) {
    var projectNameAndVersion = _componentName.split("@");
    projectName = projectNameAndVersion[0];
    projectVersion = projectNameAndVersion[1];
  } else {
    projectName = _componentName;
  }

  const ameViem = new AmeViem(OPRPC, OPJutsuComponent);
  var cid = "";
  if (projectVersion != "") {
    var cidEncode = ameViem.encodeRequestParams(
      [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
      ],
      [projectName, projectVersion]
    );
    const cidResEncode = await ameViem.sendGetRequest(
      "getCIDByVersion",
      cidEncode
    );
    const cidDecode = ameViem.decodeResponseData(
      [{ name: "cid", type: "string" }],
      cidResEncode
    );

    cid = cidDecode[0];
  } else {
    var cidEncode = ameViem.encodeRequestParams(
      [{ name: "name", type: "string" }],
      [projectName]
    );
    const cidResEncode = await ameViem.sendGetRequest("getProject", cidEncode);
    const cidDecode = ameViem.decodeResponseData(
      [
        { name: "projectId", type: "uint256" },
        { name: "projectName", type: "string" },
        { name: "projectOwner", type: "address" },
        { name: "projectVersion", type: "string" },
        { name: "projectCID", type: "string" },
      ],
      cidResEncode
    );


    cid = cidDecode[4];
  }

  if (cid != "") {
    try {


      const helia = await createHelia();

      const fsHelia = unixfs(helia);

      fs.mkdirSync("src/"+_componentName, { recursive: true });

      for await (const entry of fsHelia.ls(cid)) {
        // console.log("entry", entry);
        await processEntry(fsHelia, entry, "src/"+_componentName);
      }

      spinner.clear();

      console.log(
        clc.green( "✔️ Done ")
      );

      process.exit(0);
    } catch (error) {
      console.error("Error downloading folder:", error);
    } finally {
      // await helia.stop();
    }
  } else {
    spinner.clear();
    spinner.fail(clc.red(_componentName + " not found "));
  }
}

async function processEntry(fsHelia, entry, currentPath) {
  if (entry.type === "directory") {
    const dirPath = path.join(currentPath, entry.name);

    fs.mkdirSync(dirPath, { recursive: true });
    for await (const subEntry of fsHelia.ls(entry.cid)) {
      await processEntry(fsHelia, subEntry, dirPath);
    }
  } else {
    const filePath = path.join(currentPath, entry.name);

    const url = "https://gateway.pinata.cloud/ipfs/" + entry.cid;

    const response = await axios.get(url, { responseType: "arraybuffer" });

    fs.writeFileSync(filePath, Buffer.from(response.data));
  }
}



export default {
  copyFolder,
  initConfig,
  printFileStruct,
  createComponent,
  initLocal,
  deploy,
  installComponent,
  publishComponent,
};
