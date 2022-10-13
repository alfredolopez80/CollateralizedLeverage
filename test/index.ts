import { expect } from "chai";
import moment from "moment";
import { BigNumber } from "ethers";
import {
    anyValue,
    anyUint,
} from "@nomicfoundation/hardhat-chai-matchers/withArgs";
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
let usdcWhale: any;
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
        // Try to Fail the deployment
        await expect(
            CollateralizedLeverage.deploy(
                usdcToken,
                ZERO,
                ethers.utils.parseEther("10"),
            ),
        ).to.revertedWith(
            "Stablecoin or Uniswap Router address cannot be zero",
        );
        await expect(
            CollateralizedLeverage.deploy(
                ZERO,
                swapRouter,
                ethers.utils.parseEther("10"),
            ),
        ).to.revertedWith(
            "Stablecoin or Uniswap Router address cannot be zero",
        );
        await expect(
            CollateralizedLeverage.deploy(
                usdcToken,
                owner.address,
                ethers.utils.parseEther("10"),
            ),
        ).to.revertedWith(
            "Stablecoin or Uniswap Router address must be a contract",
        );
        await expect(
            CollateralizedLeverage.deploy(
                owner.address,
                swapRouter,
                ethers.utils.parseEther("10"),
            ),
        ).to.revertedWith(
            "Stablecoin or Uniswap Router address must be a contract",
        );
        // Final Deployment
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
        usdcWhale = await ethers.getSigner(USDC_WHALE);
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

    it("Validate Method createBorrow revert if the amount in stable coin request exceed the balance of Smart Contract", async () => {
        // Verify the Balance of USDC of Smart Contract
        const balanceBefore = await usdc.balanceOf(cl.address);
        // Call emergency metohd to withdraw all stablecoin of the contract
        await cl.emergencyWithdrawERC20(owner.address);
        // Unpaused the Smart Contract
        await cl.unpause();
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("5000000000", "wei"), 2, {
                    value: ethers.utils.parseEther("8.0"),
                }),
        ).to.revertedWith("Smart Contract Not enough Stablecoin");
        // Refunds the Smart contract with the stablecoin
        await usdc
            .connect(owner)
            .transfer(cl.address, await usdc.balanceOf(owner.address));
        expect(await usdc.balanceOf(cl.address)).to.equal(balanceBefore);
    });

    it("Validate the Borrower can create the right way a Borrow", async () => {
        // Getting the Interest for Borrowers
        const interestPerMonthBorrowers =
            parseInt((await cl.interestPerMonthBorrowers()).toString()) / 1e18;
        // Validate the Borrower is not a Borrower before to create the Borrow
        expect(await cl.isBorrower(borrower1.address)).to.equal(false);
        // Getting a estimation of ETH to USDC
        const amountStableCoin = (
            await cl.getStablecoinPerETH(ethers.utils.parseEther("1.0"))
        ).div(2);
        // Validate the Create a Borrow with Borrower1
        await expect(
            cl
                .connect(borrower1)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 2, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(cl.address, borrower1.address, amountStableCoin)
            .to.emit(cl, "NewBorrow")
            .withArgs(
                borrower1.address,
                ethers.utils.parseEther("1.0"),
                amountStableCoin,
                amountStableCoin.mul(interestPerMonthBorrowers).div(100),
                await cl.getAmountMonth(ethers.utils.parseEther("1.0")),
            );
        // Display the Amount of Month of the Borrow
        console.log(
            "Amount of Month of the Borrow: ",
            parseInt(await cl.getAmountMonth(ethers.utils.parseEther("1.0"))),
        );
        // Validate the Borrower is not a Borrower After to create the Borrow
        expect(await cl.isBorrower(borrower1.address)).to.equal(true);
    });

    //** Happy Path */
    //** Traveling in the Time for 10 month and payBorrow at the time, and validate all check relations with this methods */

    it("Validate the Borrow of Borrower1 is Payable", async () => {
        // Validate the Borrow of Borrower1 is Payable
        expect(await cl.connect(borrower1).borrowIsPayable()).to.equal(true);
    });

    it("Validate the borrower1 can pay the Borrow 1 month before to finalize the Borrow", async () => {
        // Validate the time between start date and end date of the borrow is around 11 month
        const borrow = await cl.borrowings(borrower1.address);
        expect(
            (parseInt(borrow.endDate.toString()) -
                parseInt(borrow.startDate.toString())) /
                (60 * 60 * 24 * 30),
        ).to.approximately(11,1);
        // Move to Before to defeat the Borrow
        const time: moment.Moment = moment.unix(
            Math.floor((await ethers.provider.getBlock("latest")).timestamp),
        );
        // console.log("time: ", time.utc().format("YYYY-MM-DD HH:mm:ss"));
        const move: moment.Moment = moment.unix(
            time.add(10, "month").utc().unix(),
        );
        // console.log("move: ", move.utc().format("YYYY-MM-DD HH:mm:ss"));
        await network.provider.send("evm_setNextBlockTimestamp", [
            parseInt(move.utc().format("X")),
        ]);
        await network.provider.send("evm_mine", []);
        console.log(
            `Verify TimeStamp after After Start the first Issuance: `,
            move,
            " Full Date: ",
            moment(move.unix() * 1000)
                .utc()
                .format("dddd, MMMM Do YYYY, h:mm:ss a"),
        );
        // Validate the Borrow of Borrower1 Still is Payable
        expect(await cl.connect(borrower1).borrowIsPayable()).to.equal(true);
    });

    it("Validate the method payBorrow revert if the value of Stablecoin is Zero", async () => {
        // Validate the payBorrow method revert if the value of Stablecoin is Zero
        await expect(
            cl
                .connect(borrower1)
                .payBorrow(ethers.utils.parseUnits("0", "wei")),
        ).to.revertedWith("Amount must be greater than 0");
    });

    it("Validate the method parBorrow revert if the value exceed the balance of the borrower", async () => {
        // Validate the payBorrow method revert if the value of Stablecoin is Zero
        await expect(
            cl
                .connect(borrower1)
                .payBorrow(ethers.utils.parseUnits("100000000000", "wei")),
        ).to.revertedWith("Not enough Stablecoin");
    });

    it("Validate the method parBorrow revert if the value not enough for pay the Borrow", async () => {
        // Validate the payBorrow method revert if the value of Stablecoin is Zero
        await expect(
            cl
                .connect(borrower1)
                .payBorrow(ethers.utils.parseUnits("600000000", "wei")),
        ).to.revertedWith("Not enough to pay Borrow");
    });

    it("Validate the Method repayBorrow revert because the borrow still in process", async () => {
        // Validate the payBorrow method revert if the value of Stablecoin is Zero
        await expect(
            cl
                .connect(borrower1)
                .repayLoan(ethers.utils.parseUnits("600000000", "wei")),
        ).to.revertedWith("The Borrow is not expired");
    });

    it("Validate i can't release the Collateral before to Paid the Borrow", async () => {
        // Validate i can't release the Collateral only after the endDate Finalized
        await expect(cl.connect(borrower1).releaseCollateral()).to.revertedWith(
            "Borrow is not paid",
        );
    });

    it("Validate the Borrower1 can pay the Borrow Correctly", async () => {
        // add more USDC to borrower1 balance
        await expect(
            usdc
                .connect(usdcWhale)
                .transfer(
                    borrower1.address,
                    ethers.utils.parseUnits("800000000", "wei"),
                ),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(
                usdcWhale.address,
                borrower1.address,
                ethers.utils.parseUnits("800000000", "wei"),
            );
        // Approve to Cl smart contract spend money of borrower1
        await expect(
            usdc
                .connect(borrower1)
                .approve(
                    cl.address,
                    ethers.utils.parseUnits("1400000000", "wei"),
                ),
        )
            .to.emit(usdc, "Approval")
            .withArgs(
                borrower1.address,
                cl.address,
                ethers.utils.parseUnits("1400000000", "wei"),
            );
        // Getting data of the Borrow
        let borrow = await cl.borrowings(borrower1.address);
        const amountToPaid = await cl.getAmountToPaid(borrower1.address);
        const interest = borrow.interest;
        console.log("Amount to Pay: ", amountToPaid.toString() / 1e6);
        console.log("Interest: ", interest.toString() / 1e6);
        // Try to Pay the Borrow
        await expect(cl.connect(borrower1).payBorrow(amountToPaid))
            .to.emit(usdc, "Transfer")
            .withArgs(borrower1.address, cl.address, amountToPaid)
            .to.emit(cl, "BorrowPaid")
            .withArgs(
                borrower1.address,
                ethers.utils.parseEther("1.0"),
                borrow.amountStableCoin,
                interest,
            );
        // Validate the Borrow status is PAID
        borrow = await cl.borrowings(borrower1.address);
        expect(borrow.status).to.equal(2);
    });

    it("Validate i can't release the Collateral before the endDate Finalized", async () => {
        // Validate i can't release the Collateral only after the endDate Finalized
        await expect(cl.connect(borrower1).releaseCollateral()).to.revertedWith(
            "The Borrow is not expired yet",
        );
    });

    it("Validate the Lender can't claim the Collateral if the Borrow not expired or the debt exceed the value in stablecoin of the Collateral", async () => {
        // Validate the Lender can't collect the Collateral if the Borrow not expired or the debt exceed the value in stablecoin of the Collateral
        await expect(
            cl.connect(lender1).claimCollateral(borrower1.address),
        ).to.revertedWith("Lender cannot claim the Collateral");
        // Validate for lender is the Collateral is claimable
        expect(
            await cl.connect(lender1).collateralIsClaimabe(borrower1.address),
        ).to.equal(false);
    });

    it("Validate another Lender can't claim the Collateral of the Lender1", async () => {
        // Validate another Lender can't claim the Collateral of the Lender1
        await expect(
            cl.connect(lender3).claimCollateral(borrower1.address),
        ).to.revertedWith("Not the Lender of this Borrower");
        // Validate the owner or any another waller can't claim the Collateral
        await expect(
            cl.connect(owner).claimCollateral(borrower1.address),
        ).to.revertedWith("Not the Lender of this Borrower");
        await expect(
            cl.connect(borrower5).claimCollateral(borrower1.address),
        ).to.revertedWith("Not the Lender of this Borrower");
    });

    it("Validate the borrower 1 only can claim the Collateral after the Borrow expired", async () => {
        // Move to Before to defeat the Borrow
        const time: moment.Moment = moment.unix(
            Math.floor((await ethers.provider.getBlock("latest")).timestamp),
        );
        // console.log("time: ", time.utc().format("YYYY-MM-DD HH:mm:ss"));
        const move: moment.Moment = moment.unix(
            time.add(1, "month").utc().unix(),
        );
        // console.log("move: ", move.utc().format("YYYY-MM-DD HH:mm:ss"));
        await network.provider.send("evm_setNextBlockTimestamp", [
            parseInt(move.utc().format("X")),
        ]);
        await network.provider.send("evm_mine", []);
        console.log(
            `Verify TimeStamp after After Start the first Issuance: `,
            move,
            " Full Date: ",
            moment(move.unix() * 1000)
                .utc()
                .format("dddd, MMMM Do YYYY, h:mm:ss a"),
        );
        // getting data fo the borrow
        let borrow = await cl.borrowings(borrower1.address);
        // Validate the balance in Eth of the borrower1
        const balanceBefore = await ethers.provider.getBalance(
            borrower1.address,
        );
        // Validate the borrower 1 only can claim the Collateral after the Borrow expired
        await expect(cl.connect(borrower1).releaseCollateral())
            .to.emit(cl, "ReleaseCollateral")
            .withArgs(
                borrower1.address,
                ethers.utils.parseEther("1.0"),
                borrow.amountStableCoin,
                borrow.interest,
            );
        // Update borrow
        borrow = await cl.borrowings(borrower1.address);
        // Validate the Borrow status is RELEASED
        expect(borrow.status).to.equal(3);
        // Validate the balance of borrower1 After is 1 ETH more
        const balanceAfter = await ethers.provider.getBalance(
            borrower1.address,
		);
        expect(balanceAfter).to.approximately(
            balanceBefore.add(ethers.utils.parseEther("1.0")),
            1e14,
        );
    });

    //** Finalize the Happy Path */

    //** Create path for Scenario 2, where the Borrower Repay the Borrow */
    it("Validate the Borrower2 can create a Borrow with the same Loan of the Lender1", async () => {
        // Validate the Borrower2 can create a Borrow with the same Loan of the Lender1
        // Getting the Interest for Borrowers
        const interestPerMonthBorrowers =
            parseInt((await cl.interestPerMonthBorrowers()).toString()) / 1e18;
        // Validate the Borrower is not a Borrower before to create the Borrow
        expect(await cl.isBorrower(borrower2.address)).to.equal(false);
        // Getting a estimation of ETH to USDC
        const amountStableCoin = (
            await cl.getStablecoinPerETH(ethers.utils.parseEther("1.0"))
        ).div(2);
        // Validate the Create a Borrow with Borrower2
        await expect(
            cl
                .connect(borrower2)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 2, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(cl.address, borrower2.address, amountStableCoin)
            .to.emit(cl, "NewBorrow")
            .withArgs(
                borrower2.address,
                ethers.utils.parseEther("1.0"),
                amountStableCoin,
                amountStableCoin.mul(interestPerMonthBorrowers).div(100),
                await cl.getAmountMonth(ethers.utils.parseEther("1.0")),
            );
        // Display the Amount of Month of the Borrow
        console.log(
            "Amount of Month of the Borrow: ",
            parseInt(await cl.getAmountMonth(ethers.utils.parseEther("1.0"))),
        );
        // Validate the Borrower is not a Borrower After to create the Borrow
        expect(await cl.isBorrower(borrower2.address)).to.equal(true);
    });

    it("Validate the Borrower2 can repayBorrow after to Defeat the Borrow, and unleash the Collateral", async () => {
        // Move to Before to defeat the Borrow
        const time: moment.Moment = moment.unix(
            Math.floor((await ethers.provider.getBlock("latest")).timestamp),
        );
        // console.log("time: ", time.utc().format("YYYY-MM-DD HH:mm:ss"));
        const move: moment.Moment = moment.unix(
            time.add(11, "month").add(1, "day").utc().unix(),
        );
        // console.log("move: ", move.utc().format("YYYY-MM-DD HH:mm:ss"));
        await network.provider.send("evm_setNextBlockTimestamp", [
            parseInt(move.utc().format("X")),
        ]);
        await network.provider.send("evm_mine", []);
        console.log(
            `Verify TimeStamp after After Start the first Issuance: `,
            move,
            " Full Date: ",
            moment(move.unix() * 1000)
                .utc()
                .format("dddd, MMMM Do YYYY, h:mm:ss a"),
        );
        // Validate the Borrow can't pay using payBorrow
        expect(await cl.connect(borrower2).borrowIsPayable()).to.equal(false);
        // add more USDC to borrower1 balance
        await expect(
            usdc
                .connect(usdcWhale)
                .transfer(
                    borrower2.address,
                    ethers.utils.parseUnits("800000000", "wei"),
                ),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(
                usdcWhale.address,
                borrower2.address,
                ethers.utils.parseUnits("800000000", "wei"),
            );
        // Approve to Cl smart contract spend money of borrower2
        await expect(
            usdc
                .connect(borrower2)
                .approve(
                    cl.address,
                    ethers.utils.parseUnits("1400000000", "wei"),
                ),
        )
            .to.emit(usdc, "Approval")
            .withArgs(
                borrower2.address,
                cl.address,
                ethers.utils.parseUnits("1400000000", "wei"),
            );
        // Validate the Borrow can't pay using payBorrow
        await cl
            .connect(borrower2)
            .payBorrow(await cl.getAmountToPaid(borrower2.address));
        // Getting data of the Borrow
        let borrow = await cl.borrowings(borrower2.address);
        expect(borrow.status).to.equal(4);
        const amountToPaid = await cl.getAmountToPaid(borrower2.address);
        const interest = borrow.interest;
        console.log("Amount to Pay: ", amountToPaid.toString() / 1e6);
        console.log("Interest: ", interest.toString() / 1e6);
        // Try to Repay with amount of Stable coin in Zero
        await expect(cl.connect(borrower2).repayLoan(0)).to.be.revertedWith(
            "Amount must be greater than 0",
        );
        // Try to Repay with amount of Stable coin more than the balance of Borrower 2
        await expect(
            cl
                .connect(borrower2)
                .repayLoan(ethers.utils.parseUnits("1500000000", "wei")),
        ).to.be.revertedWith("Not enough Stablecoin");
        // Try to Repay with amount of Stable coin under the amount necessary to repay the Loan
        await expect(
            cl.connect(borrower2).repayLoan(amountToPaid.sub(1)),
        ).to.be.revertedWith("The Amount not Enough to unleash the Collateral");
        // Try to Pay the Borrow
        await expect(cl.connect(borrower2).repayLoan(amountToPaid))
            .to.emit(usdc, "Transfer")
            .withArgs(borrower2.address, cl.address, amountToPaid)
            .to.emit(cl, "BorrowRepayed")
            .withArgs(
                borrower2.address,
                ethers.utils.parseEther("1.0"),
                borrow.amountStableCoin,
                interest,
                (
                    await cl.getAmountToPaid(borrower2.address)
                ).sub(borrow.amountStableCoin.mul(2)),
            );
        // Validate the Borrow status is PAID
        borrow = await cl.borrowings(borrower2.address);
        expect(borrow.status).to.equal(2);
        // Validate the balance in Eth of the borrower1
        const balanceBefore = await ethers.provider.getBalance(
            borrower2.address,
        );
        // Validate the borrower 2 only can claim the Collateral after the Borrow expired
        await expect(cl.connect(borrower2).releaseCollateral())
            .to.emit(cl, "ReleaseCollateral")
            .withArgs(
                borrower2.address,
                ethers.utils.parseEther("1.0"),
                borrow.amountStableCoin,
                borrow.interest,
            );
        // Update borrow
        borrow = await cl.borrowings(borrower2.address);
        // Validate the Borrow status is CLAIMED
        expect(borrow.status).to.equal(3);
        // Validate the balance of borrower1 After is 1 ETH more
        const balanceAfter = await ethers.provider.getBalance(
            borrower2.address,
        );
        expect(balanceAfter).to.approximately(
            balanceBefore.add(ethers.utils.parseEther("1.0")),
            1e14,
        );
    });

    //** End Second Scenario where the Borrower repay */

    //** Start Second Scenario where the Lender1 Claim the Collateral */

    it("Validate the Borrower3 can create a Borrow with the same Loan of the Lender1", async () => {
        // Validate the Borrower2 can create a Borrow with the same Loan of the Lender1
        // Getting the Interest for Borrowers
        const interestPerMonthBorrowers =
            parseInt((await cl.interestPerMonthBorrowers()).toString()) / 1e18;
        // Validate the Borrower is not a Borrower before to create the Borrow
        expect(await cl.isBorrower(borrower3.address)).to.equal(false);
        // Getting a estimation of ETH to USDC
        const amountStableCoin = (
            await cl.getStablecoinPerETH(ethers.utils.parseEther("1.0"))
        ).div(2);
        // Validate the Create a Borrow with Borrower3
        await expect(
            cl
                .connect(borrower3)
                .createBorrow(ethers.utils.parseUnits("600000000", "wei"), 2, {
                    value: ethers.utils.parseEther("1.0"),
                }),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(cl.address, borrower3.address, amountStableCoin)
            .to.emit(cl, "NewBorrow")
            .withArgs(
                borrower3.address,
                ethers.utils.parseEther("1.0"),
                amountStableCoin,
                amountStableCoin.mul(interestPerMonthBorrowers).div(100),
                await cl.getAmountMonth(ethers.utils.parseEther("1.0")),
            );
        // Display the Amount of Month of the Borrow
        console.log(
            "Amount of Month of the Borrow: ",
            parseInt(await cl.getAmountMonth(ethers.utils.parseEther("1.0"))),
        );
        // Validate the Borrower is not a Borrower After to create the Borrow
        expect(await cl.isBorrower(borrower3.address)).to.equal(true);
    });

    it("Validate the Borrower3 not repayBorrow and the Lender 1 Claim the Collateral", async () => {
        // Move to Before to defeat the Borrow
        const time: moment.Moment = moment.unix(
            Math.floor((await ethers.provider.getBlock("latest")).timestamp),
        );
        // console.log("time: ", time.utc().format("YYYY-MM-DD HH:mm:ss"));
        const move: moment.Moment = moment.unix(
            time.add(11, "month").add(1, "day").utc().unix(),
        );
        // console.log("move: ", move.utc().format("YYYY-MM-DD HH:mm:ss"));
        await network.provider.send("evm_setNextBlockTimestamp", [
            parseInt(move.utc().format("X")),
        ]);
        await network.provider.send("evm_mine", []);
        console.log(
            `Verify TimeStamp after After Start the first Issuance: `,
            move,
            " Full Date: ",
            moment(move.unix() * 1000)
                .utc()
                .format("dddd, MMMM Do YYYY, h:mm:ss a"),
        );
        // Validate the Borrow can't pay using payBorrow
        expect(await cl.connect(borrower3).borrowIsPayable()).to.equal(false);
        // add more USDC to borrower1 balance
        await expect(
            usdc
                .connect(usdcWhale)
                .transfer(
                    borrower3.address,
                    ethers.utils.parseUnits("800000000", "wei"),
                ),
        )
            .to.emit(usdc, "Transfer")
            .withArgs(
                usdcWhale.address,
                borrower3.address,
                ethers.utils.parseUnits("800000000", "wei"),
            );
        // Approve to Cl smart contract spend money of borrower3
        await expect(
            usdc
                .connect(borrower3)
                .approve(
                    cl.address,
                    ethers.utils.parseUnits("1400000000", "wei"),
                ),
        )
            .to.emit(usdc, "Approval")
            .withArgs(
                borrower3.address,
                cl.address,
                ethers.utils.parseUnits("1400000000", "wei"),
            );
        // Try to Pay
        await cl
            .connect(borrower3)
            .payBorrow(await cl.getAmountToPaid(borrower3.address));
        // Getting data of the Borrow
        let borrow = await cl.borrowings(borrower3.address);
        // Validate the Borrow status is DEFEATED
        expect(borrow.status).to.equal(4);
        const amountToPaid = await cl.getAmountToPaid(borrower3.address);
        const interest = borrow.interest;
        console.log("Amount to Pay: ", amountToPaid.toString() / 1e6);
        console.log("Interest: ", interest.toString() / 1e6);
        // get the Balance in Ether of lender1 before the tx
		const balanceBefore = await ethers.provider.getBalance(lender1.address);
		// Estimation Gas
		const gasEstimation = await cl
            .connect(lender1)
            .estimateGas.claimCollateral(borrower3.address);
        // Validate the Lender 1 only can claim the Collateral after the Borrow expired
        await expect(
            cl.connect(lender3).claimCollateral(borrower3.address),
        ).to.rejectedWith("Not the Lender of this Borrower");
        // Lender 1 Claim the Collateral
        await expect(cl.connect(lender1).claimCollateral(borrower3.address))
            .to.emit(cl, "ClaimCollateral")
            .withArgs(
                lender1.address,
                ethers.utils.parseEther("1.0"),
                borrow.amountStableCoin,
                borrow.interest,
            );
        // Update borrow
        borrow = await cl.borrowings(borrower3.address);
        // Validate the Borrow status is CLAIMED
        expect(borrow.status).to.equal(5);
        // Validate the balance of borrower1 After is 1 ETH more
        const balanceAfter = await ethers.provider.getBalance(lender1.address);
        expect(balanceAfter).to.approximately(
            balanceBefore.add(ethers.utils.parseEther("1.0")),
            1e14,
        );
    });

    //** End Scenario 2 where the Lender 1 Claim the Collateral */

    it("Validate the debt is zero with a borrower out time or without Borrow", async () => {
        // Validate the debt is zero with a borrower out time or without Borrow
        expect(await cl.getAmountToPaid(borrower1.address)).to.equal(
            ethers.utils.parseEther("0.0"),
        );
        expect(await cl.getAmountToPaid(borrower5.address)).to.equal(
            ethers.utils.parseEther("0.0"),
        );
    });

    it("Transfer ETH to the Contract", async () => {
        // Transfer ETH to the Contract
        await expect(
            lender1.sendTransaction({
                to: cl.address,
                value: ethers.utils.parseEther("1.0"),
            }),
        )
            .to.emit(cl, "PaymentReceived")
            .withArgs(lender1.address, ethers.utils.parseEther("1.0"));
    });

    //** Testing the Emergency withdraw Ether */
    it("Validate only the owner can withdraw all Eth in the contract", async () => {
        // Validate only the owner can withdraw all Eth in the contract
        await expect(
            cl.connect(borrower1).emergencyWithdrawETH(borrower1.address),
        ).to.revertedWith("Ownable: caller is not the owner");
        await setBalance(cl.address, ethers.utils.parseEther("1.0"));
        // Set Balance of 1 ETH into the cl smart contract
        const clBalance = await ethers.provider.getBalance(cl.address);
        const balanceBefore = await ethers.provider.getBalance(
            borrower1.address,
        );
        console.log(
            "balanceBefore: ",
            parseInt(balanceBefore.toString()) / 1e6,
        );
        // Validate the owner can withdraw all Eth in the contract
        await cl.connect(owner).emergencyWithdrawETH(borrower1.address);
        // Validate the new Balance in Ether of the borrower1
        expect(await ethers.provider.getBalance(borrower1.address)).to.equal(
            balanceBefore.add(clBalance),
        );
        // Unpaused the Smart contract
        await cl.connect(owner).unpause();
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
