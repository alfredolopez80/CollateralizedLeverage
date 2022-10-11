import { expect } from "chai";
import moment from "moment";
import { BigNumber } from "ethers";
import { ethers, network, } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    setBalance,
    impersonateAccount
} from "@nomicfoundation/hardhat-network-helpers";
import { USDC, SWAP_ROUTER_V2, ZERO} from "../scripts/address";
import { USDC_ABI } from "../files/USDC.json";
import { UNISWAP_ABI } from "../files/UniswapV2.json"

// Accounts
let owner: SignerWithAddress;
let owner2: SignerWithAddress;
let lender1: SignerWithAddress;
let lender2: SignerWithAddress;
let lender3: SignerWithAddress;
let borrower1: SignerWithAddress;
let borrower2: SignerWithAddress;
let borrower3: SignerWithAddress;
let borrower4: SignerWithAddress;
let borrower5: SignerWithAddress;
let swapRouter: any;
let usdcToken: any;
let cl: any;

describe("CollateralizedLeverage", function () {
    // Prepare all deployment Before all
    before(async function () {
        // Get all accounts
        [
            owner,
            owner2,
            lender1,
            lender2,
            lender3,
            borrower1,
            borrower2,
            borrower3,
            borrower4,
            borrower5,
        ] = await ethers.getSigners();

        // Setup the Initial Values
        if (network.name === "hardhat" || network.name === "mainnet") {
            usdcToken = USDC;
            swapRouter = SWAP_ROUTER_V2;
        } else {
            const usdc = await ethers.getContractAt(USDC_ABI, USDC, owner);
            usdcToken = usdc.address;
            const router = await ethers.getContractAt(
                UNISWAP_ABI,
                SWAP_ROUTER_V2,
                owner,
            );
            swapRouter = router.address;
        }
        // Deploy the CollateralizedLeverage Contract
        const CollateralizedLeverage = await ethers.getContractFactory(
            "CollateralizedLeverage",
            owner,
        );
        cl = await CollateralizedLeverage.deploy(
            usdcToken,
            swapRouter,
            ethers.utils.parseEther("10"),
        );
        // Display Smart Contract instantiated and Deployed
        console.log("USDC Smart Contract deployed to: ", usdcToken);
        console.log(
            "Uniswap Router V2 Smart Contract deployed to: ",
            swapRouter,
        );
        console.log(
            `Collateralized Leverage Smart Contract deployed to ${cl.address}`,
        );
    });

    // Test Transfer OwnerShip
    it("Transfer Ownership to Another Account", async function () {
        // Transfer Ownership to another account
        await cl.transferOwnership(owner2.address);
        expect(await cl.owner()).to.equal(owner2.address);
    });

    it("Renounce Ownership", async function () {
        // Renonce Ownership
        await cl.connect(owner2).renounceOwnership();
        expect(await cl.owner()).to.equal(ZERO);
    });
});
