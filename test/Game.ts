// We import Chai to use its asserting functions here.
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { Signer, Wallet, BigNumber } from "ethers";
import { ethers } from "hardhat";
import { 
  Gift__factory, 
  Gift, 
  FlashbotsCheckAndSend, 
  FlashbotsCheckAndSend__factory 
} from '../typechain'
import * as hre from "hardhat";

describe("Test Gift ", function () {

  describe("test", function () {
    let player: SignerWithAddress;
    let dao: SignerWithAddress; 
    let wallet: Wallet;
    let gift: Gift;
    let check: FlashbotsCheckAndSend;
    let roundEndSeconds: BigNumber;

    beforeEach(async function () {
      [player, dao] = await ethers.getSigners();

      const accounts = hre.config.networks.hardhat.accounts
      // @ts-expect-error
      // wallet is player
      const privateKey = accounts[0].privateKey
      wallet = new Wallet(privateKey, ethers.provider);

      roundEndSeconds = BigNumber.from(10);

      const GiftFactory = (await ethers.getContractFactory(
        "Gift",
        dao
      )) as Gift__factory;
      gift = await GiftFactory.deploy(roundEndSeconds) as Gift;
      await gift.deployed();

      const CheckandSendFactory = (await ethers.getContractFactory(
        "FlashbotsCheckAndSend",
        dao
      )) as FlashbotsCheckAndSend__factory;
      check = await CheckandSendFactory.deploy();
      await gift.deployed();
    });

    it("proves contribution increased by 1", async function () {
      const daoBalance = await dao.getBalance();
      console.log('dao $Eth: ', ethers.utils.formatEther(daoBalance));
      // get player's current contribution, should be zero
      const contribution = await gift.contributions(player.address);
      console.log('contribution', contribution);
      expect(contribution).to.equal(0);


      await ethers.provider.send('evm_increaseTime', [roundEndSeconds.toNumber() - 5]);

      // increase by one.
      
      const plus1 = await gift.recordContribution(player.address, 1);

      // call check and send with expected value of 1
      const checkTargets = gift.address;
      const checkPayloads = gift.interface.encodeFunctionData("contributions", [player.address]);

      let expectedBalance = await gift.contributions(player.address);
      // expectedBalance = expectedBalance.add(1);
      console.log('expecting player to have %d points', expectedBalance);
      const checkMatches = gift.interface.encodeFunctionResult('contributions', [expectedBalance]);
      const res = await gift.checkBytesAndSend(checkTargets, checkPayloads, checkMatches)
    });

    it("fails when expected result is not found", async function () {
      // get player's current contribution, should be zero
      
      const contribution = await gift.contributions(player.address);
      expect(contribution).to.equal(0);

      await ethers.provider.send('evm_increaseTime', [roundEndSeconds.toNumber() - 5]);

      // increase by one.
      
      const plus1 = await gift.recordContribution(player.address, 1);

      // call check and send with expected value of 1
      const checkTargets = gift.address;
      const checkPayloads = gift.interface.encodeFunctionData("contributions", [player.address]);

      let expectedBalance = await gift.contributions(player.address);
      expectedBalance = expectedBalance.add(1);
      console.log('expecting player to have %d points', expectedBalance);
      const checkMatches = gift.interface.encodeFunctionResult('contributions', [expectedBalance]);
      await expect (gift.checkBytesAndSend(checkTargets, checkPayloads, checkMatches))
        .to.be.revertedWith("response bytes mismatch");
    });

    it("contribution fails when round is over", async function () {
      await ethers.provider.send('evm_increaseTime', [roundEndSeconds.toNumber()]);
      await expect (gift.recordContribution(player.address, 1))
      .to.be.revertedWith("Round is now closed");
    });

    it("deploys when round is over", async function () {
      await ethers.provider.send('evm_increaseTime', [roundEndSeconds.toNumber()]);
      await expect (gift.deployDao())
      .to.emit(gift, "Deploy")
      .withArgs("deploying dao!");
    });


    // it.skip("works", async function () {
    //   await hre.network.provider.send("evm_setAutomine", [false]);
    //   await hre.network.provider.send("evm_setIntervalMining", [0]);

    //   console.log('player %s\n dao %s', player.address, dao.address);
    //   // get signed transaction
    //   const playerTx = await walletGame.populateTransaction.increment();
    //   playerTx.gasPrice = ethers.BigNumber.from(0);
    //   const wTx = await wallet.populateTransaction(playerTx)
    //   // console.log('player Tx', playerTx);
    //   // console.log('wTx', wTx);
    //   const mTx = await wallet.signTransaction(wTx);
    //   const revMtx = ethers.utils.parseTransaction(mTx);
    //   // console.log('signed Tx', revMtx);

    //   // original gift.

    //   let res = await ethers.provider.sendTransaction(mTx);
    //   console.log('player sent', res);

    //   // validate a bunch of input, only bundle if valid.
    //   const input = walletGame.interface.parseTransaction(revMtx);

    //   // console.log(`input`, input);
    
    //   // console.log(`response`, res);
    //   // let receipt = await res.wait()
    //   // console.log(`res`, receipt);

    //   // now dao does stuff
    //   const dg = await gift.populateTransaction.handleGift(0, player.address);
    //   dg.gasPrice = ethers.BigNumber.from(0);
    //   // console.log('dg.data', dg.data);
    //   const data = dg.data;
    //   const value = ethers.utils.parseEther("1.0");
    //   // @ts-expect-error
    //   const dgInput = gift.interface.parseTransaction({data, value});
    //   // console.log(`dao gift`, dg);
    //   // console.log(`dao gift input`, dgInput);

    //   const dsTx = await dao.sendTransaction(dg);
    //   console.log('daoSent', dsTx);

    //   /* reversing order b/c hardhat annoying */


    //   const pendingBlock = await hre.network.provider.send("eth_getBlockByNumber", [
    //     "pending",
    //     false,
    //   ]);

    //   console.log(`pending block txs`, pendingBlock.transactions)

    //   await hre.network.provider.send('evm_mine')

    //   expect(await walletGame.count(wallet.address)).to.eq(1);

    //   await hre.network.provider.send("evm_setAutomine", [true]);


    // });
  });

});
