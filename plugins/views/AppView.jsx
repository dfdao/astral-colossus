import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Navigation } from "../components/Navigation";
import { ContributeView } from "./ContributeView";
import { LeaderboardView } from "./LeaderboardView";
// import { HistoryView } from "./HistoryView";
import { HelpView } from "./HelpView";
import { CoreContractProvider } from "../components/CoreContractContext";
import { ContractProvider } from "../components/ContractContext";
import { StoreProvider } from "../components/StoreContext";
import { TransactionProvider } from "../components/TransactionContext";
import { useColossus, useContribute } from "../hooks";

export function AppView({ contract, coreContract }) {
  const [isContributing, setIsContributing] = useState(false);
  const store = { isContributing, setIsContributing };

  return (
    <CoreContractProvider value={coreContract}>
      <ContractProvider value={contract}>
        <StoreProvider value={store}>
          <TransactionProvider>
          <PluginExport />
            <Navigation
              tabs={[
                { name: "Contribute", TabContent: ContributeView },
                { name: "Leaderboard", TabContent: LeaderboardView },
                // { name: "History", TabContent: HistoryView },
                { name: "Help", TabContent: HelpView },
              ]}
            />
          </TransactionProvider>
        </StoreProvider>
      </ContractProvider>
    </CoreContractProvider>
  );
}
function PluginExport () {
  const { returnSelected, readyToFind, handleWithdrawAndReturn, handleFindAndReturn } = useColossus()

  useEffect(() => {
    window.Colossus = { returnSelected, readyToFind, handleWithdrawAndReturn, handleFindAndReturn }
    console.log(`Colossus exports`, window.Colossus);
  }, [])

  return null
}