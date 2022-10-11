import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@openzeppelin/hardhat-upgrades";
import { task } from "hardhat/config";
import dotenv from "dotenv";

dotenv.config();

module.exports = {
	solidity: {
		compilers: [
			{
				version: "0.8.15",
				settings: {
					optimizer: {
						enabled: true,
						runs: 999,
					},
				},
			},
			{
				version: "0.8.4",
				settings: {
					optimizer: {
						enabled: true,
						runs: 999,
					},
				},
			},
			{
				version: "0.8.2",
				settings: {
					optimizer: {
						enabled: true,
						runs: 999,
					},
				},
			},
			{
				version: "0.7.0",

				settings: {
					optimizer: {
						enabled: true,
						runs: 999,
					},
				},
			},
		],
	},
	mocha: {
		timeout: 500000,
	},
	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
		disambiguatePaths: false,
	},
	gasReporter: {
		currency: "USD",
		token: "ETH",
		coinmarketcap:
			process.env.COINMARKETCAP_API_KEY ||
			"f7169cda-d705-4f67-9e99-9a3985d713a4",
		enabled: true,
		// gasPrice:
		//     `https://api.etherscan.io/api?module=proxy&action=eth_gasPrice`,
		gasPrice: 35,
	},
	defaultNetwork: "hardhat",
	networks: {
		ropsten: {
			url: `https://ropsten.infura.io/v3/${process.env.INFURA_KEY}`,
			accounts: [`0x${process.env.PRIVATE_KEY}`],
		},
		goerli: {
			url: `https://goerli.infura.io/v3/${process.env.INFURA_KEY}`,
			// accounts: [`0x${process.env.PRIVATE_KEY}`],
			accounts: {
				mnemonic: process.env.MNEMONIC,
				balance: 1000,
				count: 100,
			},
		},
		mainnet: {
			url: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`,
			accounts: [`0x${process.env.PRIVATE_KEY}`],
		},
		hardhat: {
			throwOnTransactionFailures: true,
			throwOnCallFailures: true,
			forking: {
				url: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
				accounts: {
					mnemonic: process.env.MNEMONIC,
					balance: 1000,
					count: 100,
				},
			},
		},
		local: {
			url: `http://127.0.0.1:8545`,
			//accounts: [`0x${process.env.PRIVATE_KEY}`],
		},
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: `${process.env.ETHERSCAN_API_KEY}`,
	},
};
