const Web3 = require('web3');
const solc = require('solc');
const fs = require('fs');
const config = require('../config.json');

web3 = new Web3(new Web3.providers.HttpProvider(config.ETHRPC_IP_PORT));

const contractFilepath = './Storage.sol';
const configFilepath = '../config.json';
let contractData, contractABI;

(async function main() {
	await compileContract(contractFilepath);
	await deployContract(contractABI, contractData);
	await writeConfiguration(configFilepath);
})();

async function compileContract(filepath) {
	try {
		console.log('Begin to compile contract ... ');
		let source = await fs.readFileSync(filepath, 'utf8');
		let output = await solc.compile(source);
		contractABI = output.contracts[':Storage'].interface;
		contractData = '0x' + output.contracts[':Storage'].bytecode;
		config.CONTRACT_ABI = contractABI;
		config.CONTRACT_BYTECODE = contractData;
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

async function deployContract(abi, bytecode) {
	try {
		await web3.eth.personal.unlockAccount(config.COINBASE_ACCOUNT, config.PASSPHRASE, 0)
			.then(async function (result) {
				console.log('Unlock account successfully');
				let contract = new web3.eth.Contract(JSON.parse(abi));
				await contract.deploy({
					data: bytecode,
					arguments: ['Hello world !']
				}).send({
					from: config.COINBASE_ACCOUNT,
					gas: config.GAS,
					gasPrice: config.GAS_PRICE
				}).on('transactionHash', function (txHash) {
					console.log('Transcation is received. Waiting for receipt ...');
					console.log('txHash = ' + txHash);
				}).on('receipt', function (receipt) {
					console.log('contract address: ' + receipt.contractAddress);
					config.CONTRACT_ADDR = receipt.contractAddress;
				}).catch(function (error) {
					console.error(error);
				});
			});
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
}

async function writeConfiguration(filepath) {
	try {
		let config_string = JSON.stringify(config, null, 2);
		config_string = config_string.replace(/\\/g, "");
		config_string = config_string.replace(/\"\[\{/g, "\[\{");
		config_string = config_string.replace(/\}\]\"/g, "\}\]");
		await fs.writeFileSync(filepath, config_string, "utf8");
	} catch (error) {
		console.error(error);
	}
}