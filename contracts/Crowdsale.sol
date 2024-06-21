// 	SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./Token.sol";

contract Crowdsale {
	address public owner;
	string public name = "Crowdsale";
	Token public token;
	uint256 public price;
	uint256 public maxTokens;
	uint256 public tokenSold;


	event Buy(uint256 amount, address buyer);
	event Finalize(uint256 tokenSold, uint256 ethRaised);

	constructor (
		Token _token,
		uint256 _price,
		uint256 _maxTokens
	){
		owner = msg.sender;
		token = _token;
		price = _price;
		maxTokens = _maxTokens;
	}
	 	
	modifier onlyOwner() {
		//Prevent nonOwner from finalizing Crowdsale ##Comment out to test. 
		require(msg.sender == owner, 'Caller is not the Owner!!');
		_;    //for this modifier, this stands for the funciton body, to execute first before the function body.
	}


	receive() external payable {
		uint256 amount= msg.value / price ;
		buyTokens(amount * 1e18);

	}
	function buyTokens(uint256 _amount) public payable {
		require(msg.value == (_amount / 1e18 ) * price ); //checkes for correct amout ;1e18 is scientific notation for 1 to the 18th
		require(token.balanceOf(address(this)) >= _amount);  //this correspondence to the address
		require(token.transfer(msg.sender, _amount));
		
		tokenSold += _amount;


		emit Buy(_amount, msg.sender);
	}
	
	function finalize() public onlyOwner {
		//Prevent nonOwner from finalizing Crowdsale ##Comment out to test. 
		//require(msg.sender == owner);

		//send remaining tokens to crowdsale creator
		require(token.transfer(owner, token.balanceOf(address(this))));

		//send remaining tokens to crowdsale creator
		//uint256 remainingTokens = token.balanceOf(address(this));
		//token.transfer(owner, remainingTokens);


		//send ETH to crowdsale creator
		uint256 value = address(this).balance;
		(bool sent, ) = owner.call{value: value}("");
		require(sent);
		
		emit Finalize(tokenSold, value);

	}

	function setPrice(uint256 _price) public onlyOwner {
		price = _price;
	}
}