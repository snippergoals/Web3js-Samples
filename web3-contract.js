const config = require('./config');
const util = require('util');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(config.ETHRPC_IP_PORT));
console.log('Web3 version = ' + web3.version);

const password = process.argv[2] || 'passwd';
const msg = process.argv[3] || 'msg123';
console.log('Input arguments = ' + process.argv);

(async function main() {
  try {
    const contract = new web3.eth.Contract(config.CONTRACT_ABI, config.CONTRACT_ADDR);
    if (contract._address) {
      let value = await contract.methods.getValue().call();
      console.log('Original value: ' + value + '\n');

      await contract.methods.setValue(msg).send({
        from: config.COINBASE_ACCOUNT,
        gas: config.GAS,
        gasPrice: config.GAS_PRICE
      }).on('transactionHash', (hash) => {
        console.log('Transaction is received. \ntxHash = ' + hash);
      }).on('receipt', (receipt) => {
        console.log('Transaction is written. \nreceipt = ' + util.inspect(receipt) + '\n');
      }).on('error', (error) => {
        throw Error(error);
      });

      value = await contract.methods.getValue().call();
      console.log('New value: ' + value);

      await contract.methods.setValue(msg).estimateGas({
          from: config.COINBASE_ACCOUNT
        })
        .then(function (gasAmount) {
          console.log('gasAmount = ' + gasAmount + "\n");
        })
        .catch(function (error) {
          console.log(error);
        });
    } else throw Error('Failed to access contract.');

    // ------------------------------------------------

    const contract_rawTx = {
      from: config.COINBASE_ACCOUNT,
      nonce: await web3.eth.getTransactionCount(config.COINBASE_ACCOUNT),
      gasPrice: config.GAS_PRICE,
      gas: config.GAS,
      data: config.CONTRACT_BYTECODE
    }
    let signedContractTX = await web3.eth.accounts.signTransaction(contract_rawTx, config.PRIVATE_KEY);

    // deploy contract using signed tracsaction
    await web3.eth.sendSignedTransaction(signedContractTX.rawTransaction)
      .on('transactionHash', function (hash) {
        console.log('TX is received; ');
        console.log('TX hash = ' + hash);
      })
      .on('receipt', function (receipt) {
        contract_address = receipt.contractAddress;
        console.log('TX is written; ');
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('error', console.error);

    // ------------------------------------------------

    // Convert contract function to bytecode (given the contact ABI, deployed contract address and parameters)
    // Method 1: Using myContract.methods.myMethod to encode contract method (function) to transaction data (bytecode)
    /*
      myContract.methods.myMethod([param1[, param2[, ...]]]).encodeABI()
      Encodes the ABI for this method. 
      This can be used to send a transaction, call a method, or pass it into another smart contracts method as arguments.
    */
    let transaction_data1 = await contract.methods.setValue(msg).encodeABI();
    console.log('1. transaction_data (bytecode): ' + transaction_data1);

    // Convert contract function to bytecode (given the contact ABI and parameters)
    // Method 2: Using web3.eth.abi to create transaction data
    // The output is the same as that from Method 1
    /*
      The web3-eth-abi package allows you to de- and encode parameters from a ABI (Application Binary Interface). 
      This will be used for calling functions of a deployed smart-contract.
    */
    const functionABI = {
      "name": "setValue",
      "type": "function",
      "inputs": [{
        "name": "_value",
        "type": "string"
      }]
    };
    const functionName = 'setValue(string)';
    /*
      web3.eth.abi.encodeFunctionCall(jsonInterface, parameters);
      Encodes a function call using its JSON interface object and given paramaters.
    */
    let transaction_data2 = await web3.eth.abi.encodeFunctionCall(functionABI, [msg]);
    console.log('2. transaction_data (bytecode): ' + transaction_data2);

    /*
      web3.eth.abi.encodeFunctionSignature(functionName);
      Encodes the function name to its ABI signature, which are the first 4 bytes of the sha3 hash of the function name including types.
    */
    let transaction_function_hash = await web3.eth.abi.encodeFunctionSignature(functionName);
    console.log('3. transaction_function_hash: ' + transaction_function_hash);

    /*
      web3.eth.abi.encodeParameters(typesArray, parameters);
      Encodes a function parameters based on its JSON interface object.
    */
    // Note: The first 4 bytes of transaction function's hash + the encode data of transaction parameters (0x excluded)
    // Same as the output from Method 1
    let encodeParameters = await web3.eth.abi.encodeParameters(functionABI.inputs, [msg]);
    console.log('4. encoded parameters: ' + encodeParameters);

    /*
      web3.eth.abi.decodeParameters(typesArray, hexString);
      Decodes ABI encoded parameters to its JavaScript types.
    */
    // The encode data of transaction parameters can be decoded to intput parameters as denoted in corresponding ABI
    let decodeTransaction = await web3.eth.abi.decodeParameters(functionABI.inputs, encodeParameters);
    console.log('5. decoded parameters: ' + decodeTransaction.newValue);

    // ------------------------------------------------

    const transaction_rawTx = {
      from: config.COINBASE_ACCOUNT,
      to: contract_address,
      nonce: await web3.eth.getTransactionCount(config.COINBASE_ACCOUNT),
      gasPrice: config.GAS_PRICE,
      gas: config.GAS,
      data: transaction_data1, // put generated bytecode here
    }

    let transactionHash;
    console.log('transaction_rawTx: ' + util.inspect(transaction_rawTx));

    signedTX = await web3.eth.accounts.signTransaction(transaction_rawTx, config.PRIVATE_KEY);
    await web3.eth.sendSignedTransaction(signedTX.rawTransaction)
      .on('transactionHash', function (hash) {
        console.log('TX is received; ');
        console.log('TX hash = ' + hash);
        transactionHash = hash;
      })
      .on('receipt', function (receipt) {
        console.log('TX is written; ');
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('error', console.error);

    // Check whether the transaction is written in the contract
    value = await contract.methods.getValue().call();
    console.log('Value: ', value);

    // The output of web3.eth.getTransaction(transactionHash) includes the transaction data (bytecode)
    // which is created by Method 1
    let transactionDetail = await web3.eth.getTransaction(transactionHash);
    console.log('transactionDetail = ' + util.inspect(transactionDetail));
    console.log('transactionDetail.input = ' + transactionDetail.input);

  } catch (error) {
    console.log(error);
  }
})();