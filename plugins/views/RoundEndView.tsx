import { h } from "preact";

import { TWITTER_URL, DFDAO_LOGO } from "../helpers/constants";

const styles = {
  view: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    height: "100%",
    padding: "8px 48px",
  },
  logo: {
    display: "block",
    width: 64,
  },
  logoImage: {
    width: 64,
  },
};

export function RoundEndView() {
  return (
    <div style={styles.view}>
      <br />
      <p>v0.6r4 of Dark Forest has concluded.</p>
      <br />
      <p>
        In just over 28 hours, 51 players contributed 74,984,403 points to the
        Astral Colossus. Ultimately, we reached 34th on the Dark Forest
        leaderboard. A victory shared by all who participated; you will be
        remembered.
      </p>
      <br />
      <p>The Astral Colossus now slumbers. It will return.</p>
      <br />
      <a href={TWITTER_URL} style={styles.logo} target="_blank">
        <img style={styles.logoImage} src={DFDAO_LOGO} />
      </a>
    </div>
  );
}
