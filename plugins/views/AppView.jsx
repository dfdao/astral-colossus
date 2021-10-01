import { h } from "preact";
import { Navigation } from "../components/Navigation";
import { ContributeView } from "./ContributeView";
import { LeaderboardView } from "./LeaderboardView";
import { HistoryView } from "./HistoryView";
import { HelpView } from "./HelpView";
import { ContractProvider } from "../components/ContractContext";
import { TransactionProvider } from "../components/TransactionContext";

export function AppView({ contract }) {
  return (
    <ContractProvider value={contract}>
      <TransactionProvider>
        <Navigation
          tabs={[
            { name: "Contribute", TabContent: ContributeView },
            { name: "Leaderboard", TabContent: LeaderboardView },
            { name: "History", TabContent: HistoryView },
            { name: "Help", TabContent: HelpView },
          ]}
        />
      </TransactionProvider>
    </ContractProvider>
  );
}
