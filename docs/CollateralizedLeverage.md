# Contract CollateralizedLeverage
**Title:** 
**Security Contract Contact:** 

**Description:** 

---
### Globals Variables and Mappings

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| contract IERC20 | stablecoin |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| address | weth |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| contract IUniswapV2Router02 | router |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| uint256 | interestPerMonthBorrowers |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| uint256 | interestPerMonthLenders |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| uint256 | indexLoans |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| mapping(uint256 => struct CollateralizedLeverage.Loan) | loans |  |  |

#### Variable
| Type | Name | Visibility | Description |
| ---- | ---- | ---------- | ----------- |
| mapping(address => struct CollateralizedLeverage.Borrow) | borrowings |  |  |

---
### Functions

#### Methods `constructor(address _stablecoin, address _uniswapRouter, uint256 _interestPerMonth)`  Visibility:  public

**Description**: 

**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _stablecoin |
| address | _uniswapRouter |
| uint256 | _interestPerMonth |





#### Methods `receive()`  Visibility:  external

**Description**: 






#### Methods `pause()`  Visibility:  external

**Description**: Function to paused The Collateralized Leverage Contract






#### Methods `unpause()`  Visibility:  external

**Description**: Function to unpaused The Collateralized Leverage Contract






#### Methods `createLoan(uint256 _amountStableCoin)`  Visibility:  external

**Description**: Function to create a new Loan


**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountStableCoin |


**Descriptions of Arguments:**
 **Amount**: of Stablecoin to be Lending out 



#### Methods `createBorrow(uint256 _amountStableCoin, uint256 _indexLoans)`  Visibility:  external

**Description**: Function to create a new Borrow


**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountStableCoin |
| uint256 | _indexLoans |


**Descriptions of Arguments:**
 **Amount**: of Stablecoin to represent of 50% of Value of Collateral at moment to create the Borrow
  **_indexLoans**: Index of the Loand where take the stablecoin 



#### Methods `payBorrow(uint256 _amountStableCoin)`  Visibility:  external

**Description**: Function to pay a Borrow


**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountStableCoin |


**Descriptions of Arguments:**
 **Amount**: of Stablecoin to be paid 



#### Methods `repayLoan(uint256 _amountToRepay)`  Visibility:  external

**Description**: Method to repay the Loan by borrower after the deadline


**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountToRepay |


**Descriptions of Arguments:**
 **Amount**: of Stablecoin to be repaid and unleash the Collateral 



#### Methods `releaseCollateral()`  Visibility:  external

**Description**: Method to release the Collateral if the Borrow is Paid






#### Methods `claimCollateral(address borrower)`  Visibility:  external

**Description**: Method to claim the Collateral for Lender if the Borrow is Defeated

**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |





#### Methods `emergencyWithdrawERC20(address _receipt)`  Visibility:  external

**Description**: Method to getting all ERC20 token of the Contract and send to Another Account, validate only owner


**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _receipt |


**Descriptions of Arguments:**
 **_receipt**: Address of the Account that will receive the ERC20 token 



#### Methods `emergencyWithdrawETH(address payable _receipt)`  Visibility:  external

**Description**: Method to getting all ETH of the Contract and send to Another Account, validate only owner


**Arguments:**
| Type | Name |
| ---- | ---- |
| address payable | _receipt |


**Descriptions of Arguments:**
 **_receipt**: Address of the Account that will receive the ETH 



#### Methods `getAmountMonth(uint256 _amountCollateral) → uint256 amountMonth`  Visibility:  public

**Description**: Method to getting the amount of Mount where the collateral is low the stablecoin lend out plus interes

**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountCollateral |

**Outputs:**
| Type | Name |
| ---- | ---- |
| uint256 | amountMonth |




#### Methods `getAmountToPaid(address _borrower) → uint256 debt`  Visibility:  public

**Description**: Method to Getting the debt of the Borrow

**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _borrower |

**Outputs:**
| Type | Name |
| ---- | ---- |
| uint256 | debt |




#### Methods `getPriceInUSD() → uint256 price`  Visibility:  public

**Description**: Method to Getting price in USD per 1 ETH


**Outputs:**
| Type | Name |
| ---- | ---- |
| uint256 | price |




#### Methods `getStablecoinPerETH(uint256 _amountETH) → uint256 amountStablecoin`  Visibility:  public

**Description**: Method to getting the amount of Stablecoin per ETH


**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | _amountETH |

**Outputs:**
| Type | Name |
| ---- | ---- |
| uint256 | amountStablecoin |

**Descriptions of Arguments:**
 **Amount**: of Collateral 



#### Methods `collateralIsClaimabe(address _borrower) → bool`  Visibility:  public

**Description**: Method to verify if the guarantee is claimable by the Lender


**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _borrower |

**Outputs:**
| Type | Name |
| ---- | ---- |
| bool | Variable |

**Descriptions of Arguments:**
 **Address**: of the Borrower 



#### Methods `borrowIsPayable() → bool`  Visibility:  public

**Description**: Method to Validate if the Borrow is Defeated


**Outputs:**
| Type | Name |
| ---- | ---- |
| bool | Variable |




#### Methods `isBorrower(address _borrower) → bool`  Visibility:  public

**Description**: Method to Verify if the address is Borrower


**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _borrower |

**Outputs:**
| Type | Name |
| ---- | ---- |
| bool | Variable |

**Descriptions of Arguments:**
 **_borrower**: address of the Borrower 



#### Methods `isLender(address _lender) → bool`  Visibility:  public

**Description**: Method to Varify if the address is Lender


**Arguments:**
| Type | Name |
| ---- | ---- |
| address | _lender |

**Outputs:**
| Type | Name |
| ---- | ---- |
| bool | Variable |

**Descriptions of Arguments:**
 **_lender**: address of the Lender 



---
### Modifiers

---
### Events

#### Event `NewLoan(uint256 indexLoan, address lender, uint256 amountStableCoin, uint256 amountPerMount)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| uint256 | indexLoan |
| address | lender |
| uint256 | amountStableCoin |
| uint256 | amountPerMount |



#### Event `NewBorrow(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 amountPerMount, uint256 numberOfMonth)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | amountPerMount |
| uint256 | numberOfMonth |



#### Event `BorrowPaid(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |



#### Event `BorrowRepayed(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest, uint256 additionalAmount)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |
| uint256 | additionalAmount |



#### Event `BorrowDefeated(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |



#### Event `ReleaseCollateral(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |



#### Event `ClaimCollateral(address lender, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | lender |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |



#### Event `BorrowClaimed(address borrower, uint256 amountCollateral, uint256 amountStableCoin, uint256 interest)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | borrower |
| uint256 | amountCollateral |
| uint256 | amountStableCoin |
| uint256 | interest |



#### Event `PaymentReceived(address sender, uint256 amount)`

**Description:** 
**Arguments:**
| Type | Name |
| ---- | ---- |
| address | sender |
| uint256 | amount |



---
### Structs

```solidity
struct Loan {
    enum CollateralizedLeverage.StatusLoan status
    address lender
    uint256 timestamp
    uint256 amountStableCoin
    uint256 amountAllocated
    uint256 amountClaimed
    uint256 interest
}
```

```solidity
struct Borrow {
    enum CollateralizedLeverage.StatusBorrow status
    address borrower
    uint256 startDate
    uint256 endDate
    uint256 amountCollateral
    uint256 amountStableCoin
    uint256 interest
    uint256 indexLender
}
```

---
### Enums
```solidity
enum StatusLoan {
    ,
    ,
    ,
    
}
```
```solidity
enum StatusBorrow {
    ,
    ,
    ,
    ,
    ,
    
}
```
