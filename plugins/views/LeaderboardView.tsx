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
        {leaderboard.map(
          ({ rank, leaderboardRank, leaderboardScore, address, score }) => {
            const color = playerColor(address);

            if (rank === 0) {
              return (
                <div
                  style={{ ...styles.entry, color, alignItems: "baseline" }}
                  key={rank}
                >
                  <p>{rank}.</p>
                  <a
                    href="https://twitter.com/d_fdao"
                    target="_blank"
                    style={{ color }}
                    children="The Astral Colossus"
                  />
                  <p style={{ fontSize: 12, color: "#838383" }}>
                    (Rank {leaderboardRank}: {leaderboardScore})
                  </p>
                  <p style={styles.score}>{score}</p>
                </div>
              );
            }

            return (
              <div
                style={{ ...styles.entry, color, alignItems: "baseline" }}
                key={rank}
              >
                <p>{rank}.</p>
                <PlayerName address={address} />
                <p style={{ fontSize: 12, color: "#838383" }}>
                  (Rank {leaderboardRank}: {leaderboardScore})
                </p>
                <p style={styles.score}>{score}</p>
              </div>
            );
          }
        )}
      </div>
      {loading && <Loading />}
      <ErrorLabel error={error} />
    </div>
  );
}
