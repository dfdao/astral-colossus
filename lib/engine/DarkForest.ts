import { BigNumber, Contract, providers, Transaction, utils } from "ethers";
import { isAddress } from "ethers/lib/utils";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { Base } from "./Base";
import DARK_FOREST_CORE_ABI from "@darkforest_eth/contracts/abis/DarkForestCore.json"

export class DarkForest extends Base {
  private _provider: providers.JsonRpcProvider;
  private _player: string;
  private _dao: string;
  private _coreContract: Contract;
  private _playerTransferTx: utils.TransactionDescription;

  constructor(provider: providers.JsonRpcProvider, player: string, dao: string, playerTx: string, _coreAddress: string) {
    super();
    if (!isAddress(player)) throw new Error("Bad Address");
    if (!isAddress(dao)) throw new Error("Bad Address");
    this._player = player; // zeroGaswallet
    this._provider = provider;
    this._dao = dao; 
    this._coreContract = new Contract(_coreAddress, DARK_FOREST_CORE_ABI, provider);
    const revPlayerTx = utils.parseTransaction(playerTx);
    this._playerTransferTx = this._coreContract.interface.parseTransaction(revPlayerTx);
  }

  async description(): Promise<string> {
    return "Build Dark Forest calls";
    //return "Build Dark Forest calls " + (await this.getTokenBalance(this._sender)).toString() + " @ " + this._tokenContract.address + " from " + this._sender + " to " + this._recipient;
  }


  // populate the withdraw, transfer, contribute dao txs.
  async getZeroGasPriceTx(): Promise<Array<TransactionRequest>> {

    return [{
      ...(await this._coreContract.populateTransaction.withdrawSilver(this._recipient, tokenBalance)),
      gasPrice: BigNumber.from(0), // gas price of 0
      gasLimit: BigNumber.from(120000), // > gas standard limit of 21,000
    }];
  }

  private async getTokenBalance(tokenHolder: string): Promise<BigNumber> {
    return (await this._tokenContract.functions.balanceOf(tokenHolder))[0];
  }

  // verify that player's score has gone up by amount of silver on planet.
  async getDonorTx(minerReward: BigNumber): Promise<TransactionRequest> {
    const checkTargets = [this._tokenContract.address];
    const checkPayloads = [this._tokenContract.interface.encodeFunctionData('balanceOf', [this._recipient])];
    // recipient might ALREADY have a balance of these tokens. checkAndSend only checks the final state, so make sure the final state is precalculated
    // expect that recipient balance = prev_balance + zero_gas balance
    const expectedBalance = (await this.getTokenBalance(this._sender)).add(await this.getTokenBalance(this._recipient));
    const checkMatches = [this._tokenContract.interface.encodeFunctionResult('balanceOf', [expectedBalance])];
    return {
      ...(await Base.checkAndSendContract.populateTransaction.check32BytesAndSendMulti(checkTargets, checkPayloads, checkMatches)),
      value: minerReward,
      gasPrice: BigNumber.from(0),
      gasLimit: BigNumber.from(400000), // why gasLimit but no gasPrice?
    };
  }
}
