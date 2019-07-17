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
    /*
      web3.eth.getAccounts();
      For that use web3.eth.personal.newAccount().
    */
    let currentAccounts = await web3.eth.getAccounts();
    console.log(currentAccounts);
    console.log('Number of accounts = ' + currentAccounts.length);

    /* 
      web3.eth.personal.newAccount(password); 
      It differs from web3.eth.accounts.create() where the key pair is created only on client
      and it's up to the developer to manage it.
    */
    let newAccount = await web3.eth.personal.newAccount(password);
    console.log('New account = ' + newAccount);
    currentAccounts = await web3.eth.getAccounts();
    console.log(currentAccounts);
    console.log('Number of accounts = ' + currentAccounts.length);

    /*
      web3.eth.getCoinbase();
      Returns the coinbase address to which mining rewards will go.
    */
    let coinbase = await web3.eth.getCoinbase();
    console.log('Coinbase = ' + coinbase);

    /*
      web3.eth.isMining();
      Checks whether the node is mining or not.
    */
    let bIsMining = await web3.eth.isMining();
    console.log('Mining: ' + bIsMining);

    /*
      web3.eth.getBalance(address);
      Get the balance of an address at a given block.
    */
    let balance = await web3.eth.getBalance(currentAccounts[0]);
    console.log(currentAccounts[0] + ' (balance): ' + balance);

    /*
      web3.eth.accounts.create();
      Generates an account object with private key and public key.
      It's different from web3.eth.personal.newAccount() which creates an account
      over the network on the node via an RPC call.
    */
    newAccount = await web3.eth.accounts.create();
    console.log('New account = ' + util.inspect(newAccount));

    /*
      web3.eth.accounts.privateKeyToAccount(privateKey);
      Creates an account object from a private key.
    */
    let privateKey = newAccount.privateKey;
    let retrieveAccount = await web3.eth.accounts.privateKeyToAccount(privateKey);
    console.log('New account private key = ', privateKey.toString());
    console.log('Account retrieved from private key = \n' + util.inspect(retrieveAccount));

    /*
      web3.eth.accounts.encrypt(privateKey, password);
      Encrypts a private key to the web3 keystore v3 standard.
    */
    let keystore = await web3.eth.accounts.encrypt(privateKey, password);
    console.log('New keystore = \n' + util.inspect(keystore));

    /*
      web3.eth.accounts.decrypt(keystoreJsonV3, password);
      Decrypts a keystore v3 JSON, and creates the account.
    */
    let account = await web3.eth.accounts.decrypt(keystore, password);
    console.log('Account derived from keystore = \n' + util.inspect(account));

    /*
      web3.eth.accounts.hashMessage(message);
      Hashes the given message using keccak256 (SHA3-256)
    */
    let hash = await web3.eth.accounts.hashMessage(msg);
    console.log('Message hash = ' + hash);

    /*
      web3.eth.accounts.sign(data, privateKey);
      Signs arbitrary data. This data is before UTF-8 HEX decoded and enveloped.
    */
    let signedMessage = await web3.eth.accounts.sign(msg, privateKey);
    console.log('Signed message using private key = \n' + util.inspect(signedMessage));

    /*
      web3.eth.accounts.recover(signatureObject);
      web3.eth.accounts.recover(message, signature [, preFixed]);
      web3.eth.accounts.recover(message, v, r, s [, preFixed]);
      Recovers the Ethereum address which was used to sign the given data.
    */
    account = await web3.eth.accounts.recover(signedMessage);
    console.log('Recovered account from signed message = ' + account);

    /*
      web3.eth.personal.sign(dataToSign, address, password);
      Signs data using a specific account. This data is before UTF-8 HEX decoded and enveloped.
      Ganache: Method personal_sign not supported.
      Geth: supported
    */
    newAccount = await web3.eth.personal.newAccount(password);
    //let signature = await web3.eth.personal.sign(msg, newAccount, password);
    //console.log('Signed message using account = ' + signature);

    /*
      web3.eth.personal.ecRecover(dataThatWasSigned, signature);
      Recovers the account that signed the data.
    */
    // -------------------------------


    newAccount = await web3.eth.personal.newAccount(password);

    /*
      web3.eth.personal.unlockAccount(address, password, unlockDuraction);
      Unlocks the given account.
    */
    let unlock = await web3.eth.personal.unlockAccount(newAccount, password, 600);
    if (unlock) console.log('Account unlocked!');

    /*
      web3.eth.personal.lockAccount(address);
      Locks the given account.
    */
    let lock = await web3.eth.personal.lockAccount(newAccount);
    if (lock) console.log('Account locked!');


    currentAccounts = await web3.eth.getAccounts();
    /*
      web3.eth.sendTransaction(transactionObject);
      Sends a transaction to the network.
    */
    let receipt = await web3.eth.sendTransaction({
        from: currentAccounts[0],
        to: currentAccounts[1],
        value: '1000000000000000'
      })
      .on('transactionHash', function (hash) {
        console.log('TX is received; ');
        console.log('TX hash = ' + hash);
      })
      .on('receipt', function (receipt) {
        console.log('TX is written; ');
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('confirmation', function (confirmationNumber, receipt) {
        console.log('CN = ' + confirmationNumber);
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('error', console.error);

    /*
      web3.eth.getTransaction(transactionHash);
      Returns a transaction matching the given transaction hash.
    */
    let transaction = await web3.eth.getTransaction(receipt.transactionHash);
    console.log('TX hash = ' + receipt.transactionHash);
    console.log('Retrieved TX = \n' + util.inspect(transaction));

    /*
      web3.eth.getTransactionReceipt(hash);
      Returns the receipt of a transaction by transaction hash.
    */
    receipt = await web3.eth.getTransactionReceipt(receipt.transactionHash);
    console.log('Retrieved receipt = \n' + util.inspect(receipt));

    /*
      web3.eth.getTransactionCount(address [, defaultBlock]);
      Get the numbers of transactions sent from this address.
    */
    let nTransactions = await web3.eth.getTransactionCount(currentAccounts[0]);
    console.log(`Number of TXs that account ${currentAccounts[0]} sent: ` + nTransactions);

    /*
      web3.eth.getTransactionFromBlock(hashStringOrNumber, indexNumber);
      Returns a transaction based on a block hash or number and the transactions index position.
    */
    transaction = await web3.eth.getTransactionFromBlock(receipt.blockHash, receipt.transactionIndex);
    console.log('Transaction (based on blockHash) = \n' + util.inspect(transaction));
    transaction = await web3.eth.getTransactionFromBlock(receipt.blockNumber, receipt.transactionIndex);
    console.log('Transaction (based on blockNumber) = \n' + util.inspect(transaction));

    /*
      web3.eth.getBlockNumber();
      Returns the current block number.
    */
    let nBlock = await web3.eth.getBlockNumber();
    console.log('Current block number = ' + nBlock);

    /*
      web3.eth.getBlock(blockHashOrBlockNumber [, returnTransactionObjects] [, callback]);
      Returns a block matching the block number or block hash.
    */
    transaction = await web3.eth.getBlock(receipt.blockHash);
    console.log('Block (based on blockHash) = \n' + util.inspect(transaction));
    transaction = await web3.eth.getBlock(receipt.blockNumber);
    console.log('Block (based on blockNumber) = \n' + util.inspect(transaction));

    /*
      web3.eth.getBlockTransactionCount(blockHashOrBlockNumber);
      Returns the number of transaction in a given block.
    */
    nTransactions = await web3.eth.getBlockTransactionCount(receipt.blockHash);
    console.log('Number of TXs in the block (based on blockHash) = ' + nTransactions);
    nTransactions = await web3.eth.getBlockTransactionCount(receipt.blockNumber);
    console.log('Number of TXs in the block (based on blockNumber) = ' + nTransactions);



    newAccount = await web3.eth.personal.newAccount(password);

    /*
      web3.eth.sign(dataToSign, address [, callback]);
      Signs data using a specific account. This account needs to be unlocked.
      Geth: invalid argument 0: hex string has length 24, want 40 for common.Address
    */
    let signature = await web3.eth.sign(msg, newAccount);
    console.log(signature);

    const rawTx = {
      from: config.COINBASE_ACCOUNT,
      nonce: await web3.eth.getTransactionCount(config.COINBASE_ACCOUNT),
      gasPrice: config.GAS_PRICE,
      gas: config.GAS,
      to: newAccount,
      value: '1000000000000000000',
    }
    console.log(rawTx);

    /*
      web3.eth.accounts.signTransaction(transactionObject);
      The method signTransaction signs a transaction with the private key of the given address.

      [Return] The RLP encoded transaction. 
      The raw property can be used to send the transaction using web3.eth.sendSignedTransaction.
    */
    const signedTX = await web3.eth.accounts.signTransaction(rawTx, config.PRIVATE_KEY);
    console.log('rawTx = ' + util.inspect(rawTx));
    console.log('signedTX = ' + util.inspect(signedTX));

    await web3.eth.sendSignedTransaction(signedTX.rawTransaction)
      .on('transactionHash', function (hash) {
        console.log('TX hash = ' + hash);
      })
      .on('receipt', function (receipt) {
        console.log('TX is written;');
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('error', console.error);


    /*
      web3.eth.accounts.recoverTransaction(rawTransaction);
      Recovers the Ethereum address which was used to sign the given RLP encoded transaction.
    */
    let address = await web3.eth.accounts.recoverTransaction(signedTX.rawTransaction);
    console.log('Address retrieved from signedTX = ' + address);

    /*
      ethereumjs-tx package
      A simple module for creating, manipulating and signing ethereum transactions
      command: npm install ethereumjs-tx
    */
    const Tx = require('ethereumjs-tx');
    privateKey = new Buffer(config.PRIVATE_KEY.replace('0x', ''), 'hex');
    rawTx.nonce = await web3.eth.getTransactionCount(config.COINBASE_ACCOUNT);
    const tx = new Tx(rawTx);
    tx.sign(privateKey);
    const serializedTx = tx.serialize();
    console.log('serializedTx= ' + serializedTx.toString('hex'));

    await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'))
      .on('transactionHash', function (hash) {
        console.log('TX hash = ' + hash);
      })
      .on('receipt', function (receipt) {
        console.log('TX is written;');
        console.log('Receipt = ' + util.inspect(receipt));
      })
      .on('error', console.error);

    // web3.utils.randomHex(size)
    let result = web3.utils.randomHex(32);
    console.log('randomHex: ' + result);

    // web3.utils.sha3(string)
    result = web3.utils.sha3('xoxo');
    console.log('sha3: ' + result);

    // web3.utils.isHexStrict(hex)
    result = web3.utils.isHexStrict('0xc1912');
    console.log('isHexStrict: ' + result);
    result = web3.utils.isHexStrict(0xc1912);
    console.log('isHexStrict: ' + result);

    // web3.utils.isAddress(address)
    result = web3.utils.isAddress('0xc1912fee45d61c87cc5ea59dae31190fffff232d');
    console.log('isAddress: ' + result);

    // web3.utils.toChecksumAddress(address)
    result = web3.utils.toChecksumAddress('0XC1912FEE45D61C87CC5EA59DAE31190FFFFF232D');
    console.log('toChecksumAddress: ' + result);

    // web3.utils.toHex(mixed)
    result = web3.utils.toHex('234');
    console.log('toHex: ' + result);
    result = web3.utils.toHex(234);
    console.log('toHex: ' + result);

    // web3.utils.hexToNumberString(hex)
    result = web3.utils.hexToNumberString('0xea');
    console.log('hexToNumberString: ' + result);

    // web3.utils.hexToNumber(hex)
    result = web3.utils.hexToNumber('0xea');
    console.log('hexToNumber: ' + result);

    // web3.utils.hexToUtf8(hex)
    result = web3.utils.hexToUtf8('0x49206861766520313030e282ac');
    console.log('hexToUtf8: ' + result);

    // web3.utils.hexToBytes(hex)
    result = web3.utils.hexToBytes('0x000000ea');
    console.log('hexToBytes: ' + result);

    // web3.utils.toWei(number [, unit])
    result = web3.utils.toWei('1', 'ether');
    console.log('toWei: ' + result);
    result = web3.utils.toWei('1', 'finney');
    console.log('toWei: ' + result);
    result = web3.utils.toWei('1', 'szabo');
    console.log('toWei: ' + result);
    result = web3.utils.toWei('1', 'shannon');
    console.log('toWei: ' + result);

    // web3.utils.fromWei(number [, unit])
    result = web3.utils.fromWei('1', 'ether');
    console.log('fromWei: ' + result);
    result = web3.utils.fromWei('1', 'finney');
    console.log('fromWei: ' + result);
    result = web3.utils.fromWei('1', 'szabo');
    console.log('fromWei: ' + result);
    result = web3.utils.fromWei('1', 'shannon');
    console.log('fromWei: ' + result);

  } catch (error) {
    console.log(error);
  }
})();