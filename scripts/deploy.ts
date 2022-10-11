import { ethers, network } from "hardhat";
import { USDC, SWAP_ROUTER_V2 } from "./address";

async function main() {
    let usdcToken;
	let swapRouterV2;
	let cl
	const accounts = await ethers.getSigners();
	const deployer = accounts[0];
    const CollateralizedLeverage = await ethers.getContractFactory(
        "CollateralizedLeverage",
	);
	if ((network.name === "hardhat") || (network.name === "mainnet")) {
		usdcToken = USDC;
		swapRouterV2 = SWAP_ROUTER_V2;
		cl = await CollateralizedLeverage.deploy(
			usdcToken,
			swapRouterV2,
			ethers.utils.parseEther("10"),
		);
	} else {
		usdcToken = await ethers.getContractAt("ERC20", USDC, deployer);
		swapRouterV2 = await ethers.getContractAt(
            "UniswapV2Router02",
            SWAP_ROUTER_V2,
            deployer,
        );
		cl = await CollateralizedLeverage.deploy(
			usdcToken.address,
			swapRouterV2.address,
			ethers.utils.parseEther("10"),
		);
	}

    await cl.deployed();

    console.log(
        `Collateralized Leverage Smart Contract deployed to ${cl.address}`,
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
