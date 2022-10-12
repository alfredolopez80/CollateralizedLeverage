import { expect } from "chai";
import moment from "moment";
import { BigNumber } from "ethers";
import { ethers, network } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
    setBalance,
    impersonateAccount,
} from "@nomicfoundation/hardhat-network-helpers";
import {
    USDC,
    SWAP_ROUTER_V2,
    ZERO,
    WETH,
    USDC_WHALE,
} from "../scripts/address";
import { USDC_ABI } from "../files/USDC.json";
import { UNISWAP_ABI } from "../files/UniswapV2.json";

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
let usdc: any;
let router: any;

describe("CollateralizedLeverage", function () {
    //**  Prepare all deployment Before all */
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
            usdc = await ethers.getContractAt(USDC_ABI, USDC, owner);
            usdcToken = usdc.address;
            router = await ethers.getContractAt(
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

    //** Validate Initial Parameters */

    it("Validate the Addres of Stablecoin Token ERC20", async function () {
        // expect to validate is stablecoin is the same to USDC address
        expect((await cl.stablecoin()).toLowerCase()).to.equal(usdcToken);
    });

    it("Validate it Uniswap Address and Router Address of smart Contract are the same", async function () {
        // expect to validate is Uniswap Address and Router Address are the same
        console.log("Router Address of Smart Contract: ", await cl.router());
        expect(await cl.router()).to.equal(swapRouter);
        expect(await cl.router()).to.equal(SWAP_ROUTER_V2);
    });

    it("Validate the weth Address is the same of router.weth() address is the Same", async function () {
        // expect to validate is weth Address is the same of router.weth() address is the Same
        console.log("Weth Address of Smart Contract: ", await cl.weth());
        console.log("Weth Address of Router: ", await router.WETH());
        expect(await router.WETH()).to.equal(await cl.weth());
        expect(await cl.weth()).to.equal(WETH);
    });

    it("Validate the Rate of Interest for Borrowers is the same setting up whe deploy the smart contract", async function () {
        // expect to validate is Rate of Interest for Borrowers is the same setting up whe deploy the smart contract
        expect(await cl.interestPerMonthBorrowers()).to.equal(
            ethers.utils.parseEther("10"),
        );
    });

    it("Validate the Rate of Interest for Lenders is the middle of setting up whe deploy the smart contract", async function () {
        // expect to validate is Rate of Interest for Lenders is the middle of setting up whe deploy the smart contract
        expect(await cl.interestPerMonthLenders()).to.equal(
            ethers.utils.parseEther("5"),
        );
    });

    it("Validate the Index Loans start in one", async () => {
        // expect to validate is index loan start in one
        expect(await cl.indexLoans()).to.equal(1);
    });

    //** Prepara the Amount of USDC for the Lenders*/
    it("Prepare the Amount of USDC for the Lenders", async () => {
        // Impersonate the USDC Whale Account
        await impersonateAccount(USDC_WHALE);
        // Get the Signer of USDC Whale Account
        const usdcWhale = await ethers.getSigner(USDC_WHALE);
        // Get the Balance of USDC Whale Account
        console.log(
            "Balance of the USDC Whale: ",
            (await usdc.balanceOf(USDC_WHALE)).toString() / 1e6,
        );
        // Set Balance of ETH to usdcWhale
        await setBalance(usdcWhale.address, ethers.utils.parseEther("100"));
        // Transfer to Lender 1 to 1 millón of USDC
        await usdc
            .connect(usdcWhale)
            .transfer(
                lender1.address,
                ethers.utils.parseUnits("1000000000000", "wei"),
            );
        // Transfer to Lender 2 to 1 millón of USDC
        await usdc
            .connect(usdcWhale)
            .transfer(
                lender2.address,
                ethers.utils.parseUnits("1000000000000", "wei"),
            );
        // Transfer to Lender 3 to 1 millón of USDC
        await usdc
            .connect(usdcWhale)
            .transfer(
                lender3.address,
                ethers.utils.parseUnits("1000000000000", "wei"),
            );
        // Verify all Lenders have the right amount in USDC
        expect(await usdc.balanceOf(lender1.address)).to.equal(
            ethers.utils.parseUnits("1000000000000", "wei"),
        );
        expect(await usdc.balanceOf(lender2.address)).to.equal(
            ethers.utils.parseUnits("1000000000000", "wei"),
        );
        expect(await usdc.balanceOf(lender3.address)).to.equal(
            ethers.utils.parseUnits("1000000000000", "wei"),
        );
        // Lender3 Approve the Smart Contract to spend USDC
        await usdc
            .connect(lender3)
            .approve(cl.address, ethers.constants.MaxUint256);
        // Display the Balances of all Lenders
        console.log(
            "Balance of Lender 1: ",
            (await usdc.balanceOf(lender1.address)).toString() / 1e6,
        );
        console.log(
            "Balance of Lender 2: ",
            (await usdc.balanceOf(lender2.address)).toString() / 1e6,
        );
        console.log(
            "Balance of Lender 3: ",
            (await usdc.balanceOf(lender3.address)).toString() / 1e6,
        );
    });

    //** Validate Principal Flow of the Collateralized Leverage Smart Contract*/

    it("Validate method CreateLoan revert is the amount is zero", async () => {
        // Validate the Create a Loan with Lender3
        await expect(
            cl.connect(lender3).createLoan(ethers.utils.parseUnits("0", "wei")),
        ).to.revertedWith("Amount of Stablecoin must be greater than 0");
    });

    // ** Validate the Method Pause and Unpaused for the Principal Method in the Smart Contract */
    it("Paused the Smart Contract and Validate the all principal method Revert", async () => {
        //Pause Smart Contract cl
        await cl.pause();
        // Validate status of variable paused is true
        expect(await cl.paused()).to.equal(true);
        // Validate when call method createLoan revert because the smart contract is paused
        await expect(
            cl
                .connect(lender1)
                .createLoan(ethers.utils.parseUnits("10000000000", "wei")),
        ).to.revertedWith("Pausable: paused");
        // Validate when call method createBorrow revert because the smart contract is paused
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(
                    ethers.utils.parseUnits("10000000000", "wei"),
                    1,
                    {
                        value: ethers.utils.parseEther("1"),
                    },
                ),
        ).to.revertedWith("Pausable: paused");
        // Validate when call method payBorrow revert because the smart contract is paused
        await expect(
            cl
                .connect(lender1)
                .payBorrow(ethers.utils.parseUnits("100000000", "wei")),
        ).to.revertedWith("Pausable: paused");
        // Validate when call method repayLoan revert because the smart contract is paused
        await expect(
            cl
                .connect(borrower1)
                .repayLoan(ethers.utils.parseUnits("100000000", "wei")),
        ).to.revertedWith("Pausable: paused");
        // Validate when call method releaseCollateral revert because the smart contract is paused
        await expect(cl.connect(borrower1).releaseCollateral()).to.revertedWith(
            "Pausable: paused",
        );
        // Validate when call method claimCollateral revert because the smart contract is paused
        await expect(
            cl.connect(lender1).claimCollateral(borrower1.address),
        ).to.revertedWith("Pausable: paused");
        // Validate when call another method without modifier whenNotPaused
        expect(await cl.isLender(lender3.address)).to.equal(false);
        expect(await cl.isBorrower(borrower1.address)).to.equal(false);
        // Unpause Smart Contract cl
        await cl.unpause();
        // Validate status of variable paused is false
        expect(await cl.paused()).to.equal(false);
        // Getting the Interest for Lenders
        const interestPerMonthLenders =
            parseInt((await cl.interestPerMonthLenders()).toString()) / 1e18;
        // Validate the Create a Loan with Lender3
        await expect(
            cl
                .connect(lender3)
                .createLoan(ethers.utils.parseUnits("500000000", "wei")),
        )
            .to.emit(cl, "NewLoan")
            .withArgs(
                1,
                lender3.address,
                ethers.utils.parseUnits("500000000", "wei"),
                ethers.utils
                    .parseUnits("500000000", "wei")
                    .mul(interestPerMonthLenders)
                    .div(100),
            );
        // Validate the Loan was creates by Lender3
        expect(await cl.isLender(lender3.address)).to.equal(true);
    });

    it("Validate method createLoan revert if the lender1 don't approved previous to the smart contract to spend the ERC20 Token", async () => {
        // Validate the can't create a Loan with Lender1, because don't have the amount indicate in the arguments
        await expect(
            cl.connect(lender1).createLoan(ethers.utils.parseEther("1000000")),
        ).to.revertedWith("ERC20: transfer amount exceeds allowance");
    });

    it("validate method createLoan Revert if the lender1 don't have in the balance the amount indicate in the arguments", async () => {
        // Lender1 Approve the Smart Contract to spend USDC
        await usdc
            .connect(lender1)
            .approve(cl.address, ethers.constants.MaxUint256);
        // Validate the can't create a Loan with Lender1, because don't have the amount indicate in the arguments
        await expect(
            cl.connect(lender1).createLoan(ethers.utils.parseEther("1000000")),
        ).to.revertedWith("ERC20: transfer amount exceeds balance");
    });

    it("Validate the Lender1 is not a Lender before to create in the correct way the Loan", async () => {
        // Validate the Lender1 is not a Lender
        expect(await cl.isLender(lender1.address)).to.equal(false);
    });

    it("Validate the lender1 can create in the correct way a Loan", async () => {
        // Getting the Interest for Lenders
        const interestPerMonthLenders =
            parseInt((await cl.interestPerMonthLenders()).toString()) / 1e18;
        // Validate the Create a Loan with Lender1
        await expect(
            cl
                .connect(lender1)
                .createLoan(ethers.utils.parseUnits("10000000000", "wei")),
        )
            .to.emit(cl, "NewLoan")
            .withArgs(
                2,
                lender1.address,
                ethers.utils.parseUnits("10000000000", "wei"),
                ethers.utils
                    .parseUnits("10000000000", "wei")
                    .mul(interestPerMonthLenders)
                    .div(100),
            );
    });

    it("Validate the Lender1 is a Lender After to create in the correct way the Loan", async () => {
        // Validate the Lender1 is not a Lender
        expect(await cl.isLender(lender1.address)).to.equal(true);
    });

    it("Validate the all data storage in the Loan 2 from the Lender 1", async () => {
        // auxilary values
        const interestPerMonthLenders =
            (await cl.interestPerMonthLenders()) / 1e18;
        // Vallidate the all Data of the Loan 2
        const loan2 = await cl.loans(2);
        expect(loan2.status).to.equal(1);
        expect(loan2.lender).to.equal(lender1.address);
        expect(loan2.amountStableCoin).to.equal(
            ethers.utils.parseUnits("10000000000", "wei"),
        );
        expect(loan2.amountAllocated).to.equal(
            ethers.utils.parseUnits("0", "wei"),
        );
        expect(loan2.amountClaimed).to.equal(
            ethers.utils.parseUnits("0", "wei"),
        );
        expect(loan2.interest).to.equal(
            ethers.utils
                .parseUnits("10000000000", "wei")
                .mul(interestPerMonthLenders)
                .div(100),
        );
    });

    it("Validate method createLoan revert if the same Lender try to Create a New Loan", async () => {
        // Validate the Create a Loan with Lender1
        await expect(
            cl
                .connect(lender1)
                .createLoan(ethers.utils.parseUnits("10000000000", "wei")),
        ).to.revertedWith("Lender has a loan that already exists");
    });

    // ** Validate create a Borrow and check all validations */

    it("Validate Method createBorrow revert if the value in ETH is zero", async () => {
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 2, {
                    value: 0,
                }),
        ).to.revertedWith("Amount of Collateral must be greater than 0");
    });

    it("Validate Method createBorrow revert if the Index of Loans don't exists", async () => {
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 3, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        ).to.revertedWith("Loan doesn't exist");
    });

    it("Validate Method createBorrow revert if the Index of Loans don't have enough balance", async () => {
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 1, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        ).to.revertedWith("Not enough Stablecoin Available in this Index Loan");
    });

    it("Validate Method createBorrow revert if the amount in stable coin request exceed the 50 % of value of Collateral in Stablecoin", async () => {
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("1000000000", "wei"), 2, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        ).to.revertedWith(
            "The amount of Stablecoin must be greater than the amount of Collateral",
        );
    });

    it("Validate Method createBorrow revert if the amount in stable coin request exceed the 50 % of value of Collateral in Stablecoin", async () => {
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("10500000000", "wei"), 2, {
                    value: ethers.utils.parseEther("12.0"),
                }),
        ).to.revertedWith(
            "The amount of Stablecoin must be greater than the amount of Collateral",
        );
    });

    // ** Test Transfer OwnerShip */
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
