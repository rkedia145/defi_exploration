var ethers = require("ethers");
const abiDecoder = require('abi-decoder');
const v3_router_abi = require('./v3_router_abi.json');

abiDecoder.addABI(v3_router_abi);

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: './raw_transactions.csv',
  header: [
    {id: 'tx_hash', title: 'Tx_hash'},
    {id: 'tx_nonce', title: 'Tx_nonce'},
    {id: 'tx_from', title: 'Tx_from'},
    {id: 'tx_to', title: 'Tx_to'},
    {id: 'tx_value', title: 'Tx_value'},
    {id: 'tx_gas_limit', title: 'Tx_gas_limit'},
    {id: 'tx_gas_price', title: 'Tx_gas_price'},
    {id: 'tx_timestamp', title: 'Tx_timestamp'},
    {id: 'tx_data', title: 'Tx_data'},
    {id: 'tx_decoded_function', title: 'Tx_decoded_function'},
    {id: 'tx_decoded_function_params', title: 'Tx_decoded_function_params'}
    // {id: 'token_in', title: 'token_in'},
    // {id: 'token_out', title: 'token_out'},
    // {id: 'fee', title: 'fee'},
    // {id: 'recipient', title: 'recipient'},
    // {id: 'deadline', title: 'deadline'},
    // {id: 'amountIn', title: 'amountIn'},
    // {id: 'amountOutMinimum', title: 'amountOutMinimum'},
    // {id: 'sqrtPriceLimitX96', title: 'sqrtPriceLimitX96'},
  ], 
  append: true
});


var url = "wss://eth-mainnet.alchemyapi.io/v2/ffq3eEHsHEix59WRxG9YmVFELUAZSh7J";

var write_tx_to_csv = function (transaction) {
    const data = [{
        tx_hash: transaction['hash'],
        tx_nonce: transaction['nonce'],
        tx_from: transaction['from'],
        tx_to: transaction['to'],
        tx_value: transaction['value']['_hex'],
        tx_gas_limit: transaction['gasLimit']['_hex'],
        tx_gas_price: transaction['gasPrice']['_hex'],
        tx_timestamp: Date.now(),
        tx_data: transaction['data'],
        tx_decoded_function: transaction['decodedData']['name'],
        tx_decoded_function_params: JSON.stringify(transaction['decodedData']['params'][0]['value'])
        // 'token_in': transaction['decodedData']['params'][0]['value'][0],
        // 'token_out': transaction['decodedData']['params'][0]['value'][1],
        // 'fee': transaction['decodedData']['params'][0]['value'][2],
        // 'recipient': transaction['decodedData']['params'][0]['value'][3],
        // 'deadline': transaction['decodedData']['params'][0]['value'][4],
        // 'amountIn': transaction['decodedData']['params'][0]['value'][5],
        // 'amountOutMinimum': transaction['decodedData']['params'][0]['value'][6],
        // 'sqrtPriceLimitX96': transaction['decodedData']['params'][0]['value'][7],
    }]
    csvWriter.writeRecords(data).then();
}

var init = function () {
  var customWsProvider = new ethers.providers.WebSocketProvider(url);
  
  customWsProvider.on("pending", (tx) => {
    customWsProvider.getTransaction(tx).then(function (transaction) {
      if (transaction && (transaction.to == "0xE592427A0AEce92De3Edee1F18E0157C05861564")){
        const data = transaction.data;
        const decodedData = abiDecoder.decodeMethod(data);
        if (decodedData) {
            transaction['decodedData'] = decodedData;
            write_tx_to_csv(transaction);
        }
      }
    });
  });

  customWsProvider._websocket.on("error", async () => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(init, 3000);
  });
  customWsProvider._websocket.on("close", async (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    customWsProvider._websocket.terminate();
    setTimeout(init, 3000);
  });
};

init();