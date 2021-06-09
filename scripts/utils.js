/* eslint no-use-before-define: "warn" */
const fs = require("fs");
const chalk = require("chalk");
const { config, l2ethers, network, tenderly } = require("hardhat");
const { utils } = require("ethers");
const R = require("ramda");
const { JsonRpcProvider } = require("@ethersproject/providers");

async function deploy({
  rpcUrl, 
  contractName, 
  pk, ovm = false, 
  _args = [], 
  overrides = {}, 
  libraries = {}
}) {
  
  console.log(` 🛰  ${ovm?`OVM`:`EVM`} Deploying: ${contractName} on ${rpcUrl}`);

  const contractArgs = _args || [];

  const provider = new JsonRpcProvider(rpcUrl)
  const newWallet = new ethers.Wallet(pk)
  const signerProvider = newWallet.connect(provider)

  let contractArtifacts

  if(ovm === true) {
    contractArtifacts = await l2ethers.getContractFactory(contractName, signerProvider);
  } else {
    contractArtifacts = await ethers.getContractFactory(contractName, signerProvider);
  }
  
  const nonce = await signerProvider.getTransactionCount()
  const deployed = await contractArtifacts.deploy(...contractArgs, { nonce, ...overrides });
  await deployed.deployTransaction.wait()

  const checkCode = async (_address) => {
    let code = await provider.getCode(_address)
    console.log(` 📱 Code: ${code.slice(0, 100)}`)
  }

  let result = await checkCode(deployed.address)
  if(result=="0x"){
    console.log("☢️☢️☢️☢️☢️ CONTRACT DID NOT DEPLOY ☢️☢️☢️☢️☢️")
    return 0
  }

  const encoded = abiEncodeArgs(deployed, contractArgs);
  fs.writeFileSync(`artifacts/${contractName}.address`, deployed.address);

  let extraGasInfo = ""
  if(deployed&&deployed.deployTransaction){
    const gasUsed = deployed.deployTransaction.gasLimit.mul(deployed.deployTransaction.gasPrice)
    extraGasInfo = "("+utils.formatEther(gasUsed)+" ETH)"
  }

  // await tenderly.persistArtifacts({
  //   name: contractName,
  //   address: deployed.address
  // });

  // await tenderly.verify({
  //   name: contractName,
  //   address: deployed.address,
  // });

  console.log(
    " 📄",
    chalk.cyan(contractName),
    "deployed to:",
    chalk.magenta(deployed.address),
    chalk.grey(extraGasInfo)
  );

  if (!encoded || encoded.length <= 2) return deployed;
  fs.writeFileSync(`artifacts/${contractName}.args`, encoded.slice(2));

  return deployed;
};


// abi encodes contract arguments
// useful when you want to manually verify the contracts
// for example, on Etherscan
const abiEncodeArgs = (deployed, contractArgs) => {
  // not writing abi encoded args if this does not pass
  if (
    !contractArgs ||
    !deployed ||
    !R.hasPath(["interface", "deploy"], deployed)
  ) {
    return "";
  }
  const encoded = utils.defaultAbiCoder.encode(
    deployed.interface.deploy.inputs,
    contractArgs
  );
  return encoded;
};

// checks if it is a Solidity file
const isSolidity = (fileName) =>
  fileName.indexOf(".sol") >= 0 && fileName.indexOf(".swp") < 0 && fileName.indexOf(".swap") < 0;

const readArgsFile = (contractName) => {
  let args = [];
  try {
    const argsFile = `./contracts/${contractName}.args`;
    if (!fs.existsSync(argsFile)) return args;
    args = JSON.parse(fs.readFileSync(argsFile));
  } catch (e) {
    console.log(e);
  }
  return args;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

exports.deploy = deploy;
