import { h } from "preact";
import { useLeaderboard } from "../hooks";
import { Loading } from "../components/Loading";
import { ErrorLabel } from "../components/ErrorLabel";

const styles = {
  view: {
    padding: 8,
  },
  leaderboard: {},
  entry: {},
};

export function LeaderboardView() {
  const { leaderboard, loading, error } = useLeaderboard();

  return (
    <div style={styles.view}>
      <div style={styles.leaderboard}>
        {leaderboard.map(({ address, score }) => {
          return (
            <div style={styles.entry} key={address}>
              <p>
                {address}:{score}
              </p>
            </div>
          );
        })}
      </div>
      {loading && <Loading />}
      <ErrorLabel error={error} />
    </div>
  );
}
