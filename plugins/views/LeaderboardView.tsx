import { h } from "preact";
import { useLeaderboard } from "../hooks";
import { PlayerName } from "../components/PlayerName";
import { Loading } from "../components/Loading";
import { ErrorLabel } from "../components/ErrorLabel";
import { playerColor } from "../helpers/df";

const styles = {
  view: {
    padding: 8,
  },
  leaderboard: {},
  entry: {
    display: "flex",
    gap: 8,
  },
  score: {
    marginLeft: "auto",
  },
};

export function LeaderboardView() {
  const { leaderboard, loading, error } = useLeaderboard();

  return (
    <div style={styles.view}>
      <div style={styles.leaderboard}>
        {leaderboard.map(({ rank, address, score }) => {
          const color = playerColor(address);

          return (
            <div style={{ ...styles.entry, color }} key={rank}>
              <p>{rank}.</p>
              <PlayerName address={address} />
              <p style={styles.score}>{score}</p>
            </div>
          );
        })}
      </div>
      {loading && <Loading />}
      <ErrorLabel error={error} />
    </div>
  );
}
