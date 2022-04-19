require('@nomiclabs/hardhat-waffle');

module.exports = {
  solidity: "0.8.0",
  networks: {
    ropsten: {
      url: "https://eth-ropsten.alchemyapi.io/v2/CkM4ySdfjAYdwc2ac_sBU6KbnU_58-dD",
      accounts: ["438e0fc1069f27a96ca46b3ea65dd16119d6de797c4c63311a745305cef7412a"]
    }
  }
}