/// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

// Uncomment this line to use console.log

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

import "hardhat/console.sol";

contract CollateralizedLeverage is Ownable, Pausable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address;
    using Math for uint256;
    using SafeERC20 for IERC20;
    /// Stable Coin
    IERC20 public stablecoin;
    /// Address of WETH9
    address public weth;
    /// Router of Uniswap
    IUniswapV2Router02 public immutable router;
    /// Monthly Interest Offered to Lenders where i.e. 100 ETH represent 100 % interest and 10 represent 10 % interest
    uint256 public interestPerMonthBorrowers;
    /// Monthly Interest Offered to Lenders where i.e. 100 ETH represent 100 % interest and 5 represent 5 % interest
    uint256 public interestPerMonthLenders;
    /// Index of Loans
    uint256 public indexLoans;

    /// Enum os status Loan
    enum StatusLoan {
        STARTED,
        PROCESSING,
        PENDING,
        PAID
    }

    enum StatusBorrow {
        STARTED, // Borrow Started
        PROCESSING, // Borrow Processing
        PAID, // Borrow Paid
        RELEASED, // Collateral Released
        DEFEATED, // Borrow Defeated
        CLAIMED // Collateral Claimed
    }

    /// Struct for Loan
    /// @param lender: Address of the lender
    /// @param timestamp: TimeStamp of the Loan
    /// @param amount: Amount of the Loan in Stablecoin
    /// @param interest: Interest of the Loan in Stablecoin
    struct Loan {
        StatusLoan status;
        address lender;
        uint256 timestamp;
        uint256 amountStableCoin;
        uint256 amountAllocated;
        uint256 amountClaimed;
        uint256 interest;
    }

    /// Struct for Borrow of Collateral
    /// @param borrower: Address of the borrower
    /// @param timestamp: TimeStamp of the Borrow
    /// @param amountCollateral: Amount of Coin locked as Collateral
    /// @param amountStableCoin: Amount of Stablecoin Lending out
    /// @param interest: Interest of the Borrow in Stablecoin
    struct Borrow {
        StatusBorrow status;
        address borrower;
        uint256 startDate;
        uint256 endDate;
        uint256 amountCollateral;
        uint256 amountStableCoin;
        uint256 interest;
        uint256 indexLender;
    }

    /// Mapping for Deposits of a Lender
    mapping(uint256 => Loan) public loans;

    /// Mapping for Borrow of a Borrower
    mapping(address => Borrow) public borrowings;

    /// Event for when a new Loan is created, where `amountPerMount` is the amount of Stablecoin received based on the interest of the Loan
    event NewLoan(
		uint256 indexed indexLoan,
        address indexed lender,
        uint256 amountStableCoin,
        uint256 amountPerMount
    );
    /// Event for when a new Borrow is created, where `amountPerMount` is the amount of Stablecoin must to pay based on the interest of the Loan
    event NewBorrow(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 amountPerMount,
        uint256 numberOfMonth
    );
    /// Event for when a Borrow is paid
    event BorrowPaid(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest
    );
    /// Event for when a Borrow is paid
    event BorrowRepayed(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest,
        uint256 additionalAmount
    );
    /// Event for when a Borrow is defeated
    event BorrowDefeated(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest
    );
    /// Event for when the Collateral is released, because the Borrower paid the Loan
    event ReleaseCollateral(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest
    );
    /// Event for when the Collateral is withdraw for lender, because the Borrower doesn't Paid the Loan
    event ClaimCollateral(
        address indexed lender,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest
    );
    /// Event for when a Borrow is claimed
    event BorrowClaimed(
        address indexed borrower,
        uint256 amountCollateral,
        uint256 amountStableCoin,
        uint256 interest
    );
    /// Event for smart Contract receive ETH
    event PaymentReceived(address indexed sender, uint256 amount);

    constructor(
        address _stablecoin,
        address _uniswapRouter,
        uint256 _interestPerMonth // for Borrowers
    ) {
        if ((_stablecoin == address(0)) || (_uniswapRouter == address(0))) {
            revert("Stablecoin or Uniswap Router address cannot be zero");
        }
        if (
            (_stablecoin.isContract() == false) ||
            (_uniswapRouter.isContract() == false)
        ) {
            revert("Stablecoin or Uniswap Router address must be a contract");
        }
        stablecoin = IERC20(_stablecoin);
        router = IUniswapV2Router02(_uniswapRouter);
        weth = router.WETH();
        interestPerMonthLenders = _interestPerMonth.div(2); // This means that half of the interest is for the platform and the other half for the lenders.
        interestPerMonthBorrowers = _interestPerMonth;
        indexLoans = 1;
    }

    receive() external payable {
        emit PaymentReceived(_msgSender(), msg.value);
    }

    /// @dev Function to paused The Collateralized Leverage Contract
    function pause() external whenNotPaused onlyOwner {
        _pause();
    }

    /// @dev Function to unpaused The Collateralized Leverage Contract
    function unpause() external whenPaused onlyOwner {
        _unpause();
    }

    /// @dev Function to create a new Loan
    /// @param _amountStableCoin: Amount of Stablecoin to be Lending out
    function createLoan(uint256 _amountStableCoin)
        external
        whenNotPaused
        nonReentrant
    {
        address caller = _msgSender();
        require(
            isLender(caller) == false,
            "Lender has a loan that already exists"
        );
        require(_amountStableCoin > 0, "Amount of Stablecoin must be greater than 0");
        stablecoin.safeTransferFrom(caller, address(this), _amountStableCoin);
        loans[indexLoans] = Loan({
            status: StatusLoan.PROCESSING,
            lender: caller,
            timestamp: block.timestamp,
            amountStableCoin: _amountStableCoin,
            amountAllocated: 0,
            amountClaimed: 0,
            interest: _amountStableCoin.mulDiv(interestPerMonthLenders, 1 ether).div(100)
        });
        emit NewLoan(
			indexLoans,
            caller,
            _amountStableCoin,
            _amountStableCoin.mulDiv(interestPerMonthLenders, 1 ether).div(100)
        );
        indexLoans++;
    }

    /// @dev Function to create a new Borrow
    /// @param _amountStableCoin: Amount of Stablecoin to represent of 50% of Value of Collateral at moment to create the Borrow
    function createBorrow(uint256 _amountStableCoin, uint256 _indexLoans)
        external
        payable
        whenNotPaused
        nonReentrant
    {
        uint256 value = msg.value;
		require(value > 0, "Amount of Collateral must be greater than 0");
        Loan memory loan = loans[_indexLoans];
        require(loan.status == StatusLoan.PROCESSING, "Loan doesn't exist");
		uint256 amountStableCoin = getStablecoinPerETH(value).div(2);
        require(
            amountStableCoin >= _amountStableCoin,
            "The amount of Stablecoin must be greater than the amount of Collateral"
        );
        require(
            loan.amountStableCoin.sub(loan.amountAllocated) >=
                amountStableCoin,
            "Not enough Stablecoin Available in this Index Loan"
        );
		address caller = _msgSender();
        require(
            borrowings[caller].status == StatusBorrow.STARTED,
            "Borrow already exists"
        );
        require(
            stablecoin.balanceOf(address(this)) >= amountStableCoin,
            "Smart Contract Not enough Stablecoin"
        );
        stablecoin.safeTransfer(caller, amountStableCoin);
        borrowings[caller] = Borrow({
            status: StatusBorrow.PROCESSING,
            borrower: caller,
            startDate: block.timestamp,
            endDate: block.timestamp.add(getAmountMonth(value).mul(30 days)),
            amountCollateral: value,
            amountStableCoin: amountStableCoin,
            interest: amountStableCoin.mulDiv(interestPerMonthBorrowers, 1 ether).div(100),
            indexLender: _indexLoans
        });
        loans[_indexLoans].amountAllocated = loans[_indexLoans]
            .amountAllocated
            .add(amountStableCoin);
        emit NewBorrow(
            caller,
            value,
            amountStableCoin,
            amountStableCoin.mulDiv(interestPerMonthBorrowers, 1 ether).div(100),
            getAmountMonth(value)
        );
    }

    /// @dev Function to pay a Borrow
    /// @param _amountStableCoin: Amount of Stablecoin to be paid
    function payBorrow(uint256 _amountStableCoin)
        external
        whenNotPaused
        nonReentrant
    {
        address caller = _msgSender();
        Borrow memory borrow = borrowings[caller];
        require(borrow.status == StatusBorrow.PROCESSING, "Borrow not exists");
        require(_amountStableCoin > 0, "Amount must be greater than 0");
        require(
            stablecoin.balanceOf(caller) >= _amountStableCoin,
            "Not enough Stablecoin"
        );
        if (block.timestamp >= borrow.endDate) {
            borrow.status = StatusBorrow.DEFEATED;
            /// Emit Event
            emit BorrowDefeated(
                caller,
                borrow.amountCollateral,
                borrow.amountStableCoin,
                borrow.interest
            );
        } else {
            require(
                (_amountStableCoin >= getAmountToPay(caller) &&
                    (_amountStableCoin >= borrow.amountStableCoin.mul(2))),
                "Not enough to pay"
            );
            borrow.status = StatusBorrow.PAID;
            // Execute the Transfer
            stablecoin.safeTransferFrom(
                caller,
                address(this),
                _amountStableCoin
            );
            /// Emit Event
            emit BorrowPaid(
                caller,
                borrow.amountCollateral,
                borrow.amountStableCoin,
                borrow.interest
            );
        }
        /// Update the Storage
        borrowings[caller] = borrow;
    }

    /// @dev Method to repay the Loan by borrower after the deadline
    /// @param _amountToRepay: Amount of Stablecoin to be repaid and unleash the Collateral
    function repayLoan(uint256 _amountToRepay)
        external
        whenNotPaused
        nonReentrant
    {
        address caller = _msgSender();
        require(_amountToRepay > 0, "Amount must be greater than 0");
        require(
            stablecoin.balanceOf(caller) >= _amountToRepay,
            "Not enough Stablecoin"
        );
        Borrow memory borrow = borrowings[caller];
        if (block.timestamp >= borrow.endDate) {
            require(
                _amountToRepay >= getAmountToPay(caller),
                "The Amount not Enough to unleash the Collateral"
            );
            /// Execute the Transfer
            stablecoin.safeTransferFrom(caller, address(this), _amountToRepay);
            /// Emit Event
            emit BorrowRepayed(
                caller,
                borrow.amountCollateral,
                borrow.amountStableCoin,
                borrow.interest,
                getAmountToPay(caller).sub(borrow.amountStableCoin.mul(2))
            );
            /// Update the Storage
            borrow.status = StatusBorrow.PAID;
            borrowings[caller] = borrow;
        } else {
            revert("The Borrow is not expired");
        }
    }

    /// @dev Method to release the Collateral if the Borrow is Paid
    function releaseCollateral() external whenNotPaused nonReentrant {
        address caller = _msgSender();
        Borrow memory borrow = borrowings[caller];
        require(borrow.status == StatusBorrow.PAID, "Borrow is not paid");
        require(
            block.timestamp >= borrow.endDate,
            "The Borrow is not expired yet"
        );
        borrow.status = StatusBorrow.RELEASED;
        /// Emit Event
        emit ReleaseCollateral(
            caller,
            borrow.amountCollateral,
            borrow.amountStableCoin,
            borrow.interest
        );
        /// Update the Storage
        borrowings[caller] = borrow;
        /// Transfer the Collateral
        // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
        (bool success, ) = caller.call{value: borrow.amountCollateral}("");
        require(
            success,
            "Address: unable to send value, recipient may have reverted"
        );
    }

    /// @dev Method to claim the Collateral for Lender if the Borrow is Defeated
    function claimCollateral(address borrower)
        external
        whenNotPaused
        nonReentrant
    {
        address caller = _msgSender();
        Borrow memory borrow = borrowings[borrower];
        if (collateralIsClaimabe(borrower)) {
            borrow.status = StatusBorrow.CLAIMED;
            /// Emit Event
            emit ClaimCollateral(
                caller,
                borrow.amountCollateral,
                borrow.amountStableCoin,
                borrow.interest
            );
            /// Update the Storage
            loans[borrow.indexLender].amountClaimed = loans[borrow.indexLender]
                .amountClaimed
                .add(getStablecoinPerETH(borrow.amountCollateral));
            borrowings[caller] = borrow;
            /// Transfer the Collateral

            // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
            (bool success, ) = caller.call{value: borrow.amountCollateral}("");
            require(
                success,
                "Address: unable to send value, recipient may have reverted"
            );
        } else {
            revert("Lender cannot claim the Collateral");
        }
    }

	// ------- Emergency Methods ------------- //

	/// @dev Method to getting all ERC20 token of the Contract and send to Another Account, validate only owner
	/// @param _receipt Address of the Account that will receive the ERC20 token
	function emergencyWithdrawERC20(address _receipt) external onlyOwner {
		require(_receipt != address(0), "Receipt Address cannot be 0x0");
		// Paused all Methods
		_pause();
		IERC20 token = IERC20(stablecoin);
		uint256 balance = token.balanceOf(address(this));
		token.safeTransfer(_receipt, balance);
	}

	/// @dev Method to getting all ETH of the Contract and send to Another Account, validate only owner
	/// @param _receipt Address of the Account that will receive the ETH
	function emergencyWithdrawETH(address payable _receipt) external onlyOwner {
		require(_receipt != address(0), "Receipt Address cannot be 0x0");
		// Paused all Methods
		_pause();
		uint256 balance = address(this).balance;
		// solhint-disable-next-line avoid-low-level-calls, avoid-call-value
		(bool success, ) = _receipt.call{value: balance}("");
		require(
			success,
			"Address: unable to send value, recipient may have reverted"
		);
	}

    /// @dev Method to getting the amount of Mount where the collateral is low the stablecoin lend out plus interes
    function getAmountMonth(uint256 _amountCollateral)
        public
        view
        returns (uint256 amountMonth)
    {
        uint256 amountStableCoin = getStablecoinPerETH(_amountCollateral).div(
            2
        );
        uint256 amountPerMonth = amountStableCoin.mulDiv(
            interestPerMonthBorrowers,
            100
        );
        amountMonth = amountStableCoin.div(amountPerMonth);
        if (amountStableCoin.mod(amountPerMonth) > 0) amountMonth++;
    }

    /// @dev Method to Getting the debt of the Borrow
    function getAmountToPay(address _borrower)
        public
        view
        returns (uint256 debt)
    {
        uint256 amountMonthPaid;
        Borrow memory borrow = borrowings[_borrower];
        uint256 amountPerMonth = borrow.amountStableCoin.mulDiv(
            interestPerMonthBorrowers,
            100
        );
        if (
            (borrow.status == StatusBorrow.PROCESSING) &&
            (block.timestamp < borrow.endDate)
        ) {
            amountMonthPaid = borrow.endDate.sub(borrow.startDate).div(30 days);
            if (borrow.endDate.sub(borrow.startDate).mod(30 days) > 0)
                amountMonthPaid++;
            debt = borrow.amountStableCoin.add(
                amountPerMonth.mul(amountMonthPaid)
            );
        } else if (
            ((block.timestamp >= borrow.endDate) &&
                ((borrow.status == StatusBorrow.PROCESSING) ||
                    (borrow.status == StatusBorrow.DEFEATED)))
        ) {
            amountMonthPaid = block.timestamp.sub(borrow.startDate).div(
                30 days
            );
            debt = borrow.amountStableCoin.add(
                amountPerMonth.mul(amountMonthPaid)
            );
        } else {
            debt = 0;
        }
    }

    /// @dev Method to Getting price in USD per 1 ETH
    function getPriceInUSD() public view returns (uint256 price) {
        address[] memory path = new address[](2);
        path[0] = weth;
        path[1] = address(stablecoin);
        price = router.getAmountsOut(1 ether, path)[1];
    }

    /// @dev Method to getting the amount of Stablecoin per ETH
    /// @param _amountETH: Amount of Collateral
    function getStablecoinPerETH(uint256 _amountETH)
        public
        view
        returns (uint256 amountStablecoin)
    {
        amountStablecoin = _amountETH.mulDiv(getPriceInUSD(), 1 ether);
    }

    /// @dev Method to verify if the guarantee is claimable by the Lender
    /// @param _borrower: Address of the Borrower
    function collateralIsClaimabe(address _borrower)
        public
        view
        returns (bool)
    {
        address caller = _msgSender();
        Borrow memory borrow = borrowings[_borrower];
        require(
            loans[borrow.indexLender].lender == caller,
            "Not the Lender of this Borrower"
        );
        if (
            ((borrow.status == StatusBorrow.PROCESSING) &&
                (block.timestamp < borrow.endDate) &&
                (borrow.amountStableCoin.add(
                    borrow.interest.mul(
                        block.timestamp.sub(borrow.startDate).div(30 days)
                    )
                ) >= getStablecoinPerETH(borrow.amountCollateral))) ||
            ((borrow.status == StatusBorrow.DEFEATED) &&
                (block.timestamp >= borrow.endDate))
        ) return true;
        else return false;
    }

    /// @dev Method to Varify if the address is Borrower
    /// @param _borrower address of the Borrower
    function isBorrower(address _borrower) public view returns (bool) {
        return borrowings[_borrower].status != StatusBorrow.STARTED;
    }

    /// @dev Method to Varify if the address is Lender
    /// @param _lender address of the Lender
    function isLender(address _lender) public view returns (bool) {
        for (uint256 i = 1; i <= indexLoans; i++) {
            if (loans[i].lender == _lender) return true;
        }
        return false;
    }
}
