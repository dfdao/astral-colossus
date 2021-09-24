// "SPDX-License-Identifier: UNLICENSED"

pragma solidity ^0.7.6;

import "hardhat/console.sol";

contract Gift {

  address public owner;
  uint256 public ROUND_END_TIMESTAMP; 


  mapping (address => uint256) public contributions;

  event Deploy(string msg);

  constructor (uint256 _roundEndSeconds) {
    owner = msg.sender;
    ROUND_END_TIMESTAMP = block.timestamp + (_roundEndSeconds * 1 seconds);
  }

  modifier onlyOwner {
    require(msg.sender == owner, "only owner can call");
    _;
  }

  modifier open() {
      require(block.timestamp < ROUND_END_TIMESTAMP, "Round is now closed");
      _;
  }

  modifier closed() {
    require(block.timestamp > ROUND_END_TIMESTAMP, "Round is still open");
    _;
  }

  function recordContribution(address player, uint256 contribution) onlyOwner open public {
    contributions[player] += contribution;
  }

  function getContribution(address player) public view returns (uint256) {
    return contributions[player];
  }

  function deployDao() public onlyOwner closed {
    emit Deploy("deploying dao!");
  }

  /* copied from Flashbots checkBytesAndSend */
  function checkBytesAndSend(address _target, bytes memory _payload, bytes memory _resultMatch) external payable {
    _checkBytes(_target, _payload, _resultMatch);
    block.coinbase.transfer(msg.value);
  }

  function _checkBytes(address _target, bytes memory _payload, bytes memory _resultMatch) internal view {
    (bool _success, bytes memory _response) = _target.staticcall(_payload);
    // console.log("input: %s response: %s", _res, keccak256(_response));
    require(_success, "!success");
    require(keccak256(_resultMatch) == keccak256(_response), "response bytes mismatch");
  }


}