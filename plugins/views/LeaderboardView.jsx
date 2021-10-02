import { h } from "preact";
import { useContract } from "../hooks";
import { getContract } from "../helpers/df";
import { getWallet } from "../helpers/wallet";

const styles = {
  view: {
    padding: 8,
  },
};

export function LeaderboardView() {

  const getScore = async () => {
    const { colossus, COLOSSUS_ADDRESS, COLOSSUS_ABI } = await getContract();
    const wallet = getWallet();
    const score = await colossus.contributions(wallet.address);
    // @ts-expect-error
    df.terminal.current.println(`score ${score}`);
  }

  return(
    <div>
      <div style={styles.view}>Leaderboard</div>
      <button onClick={getScore}>Get Score</button>
    </div>
    
  ); 
}
