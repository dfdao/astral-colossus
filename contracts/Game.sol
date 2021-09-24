// "SPDX-License-Identifier: UNLICENSED"

pragma solidity ^0.7.6;

import "hardhat/console.sol";

interface IGame {
    function count() external view returns (uint);

    function increment() external;
}


contract Game {

    event Increment(address, uint256);

    mapping(address => uint256) public score;

    constructor () {}

    function increment() public {
      score[msg.sender] += 1;
      console.log('score of %s is %d', msg.sender, score[msg.sender]);
      emit Increment(msg.sender, score[msg.sender]);
    }

    function count(address account) public view returns (uint256) {
      return score[account];
    }

    function sayHi() public view {
      console.log("hi!");
    }

    function whoami() public view returns (address) {
      return msg.sender;
    }
}


