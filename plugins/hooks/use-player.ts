import { ethers } from "ethers";

export const usePlayer = () => {
  const url = "http://165.227.93.253:8545";
  const provider = new ethers.providers.JsonRpcProvider(url);

  // @ts-expect-error
  const wallet = new ethers.Wallet(df.getPrivateKey(), provider);

  return wallet
}