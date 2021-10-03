import { h } from "preact";
import { useLeaderboard } from "../hooks";
import { PlayerName } from "../components/PlayerName";
import { Loading } from "../components/Loading";
import { ErrorLabel } from "../components/ErrorLabel";

const styles = {
  view: {
    padding: 8,
  },
  leaderboard: {},
  entry: {
    display: "flex",
    gap: 8,
  },
};

export function LeaderboardView() {
  const { leaderboard, loading, error } = useLeaderboard();

  return (
    <div style={styles.view}>
      <div style={styles.leaderboard}>
        {leaderboard.map(({ rank, address, score }) => {
          return (
            <div style={styles.entry} key={rank}>
              <p>{rank}</p>
              <PlayerName address={address} />
              <p>{score}</p>
            </div>
          );
        })}
      </div>
      {loading && <Loading />}
      <ErrorLabel error={error} />
    </div>
  );
}
