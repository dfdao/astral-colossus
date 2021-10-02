import { h } from "preact";
import { Detail } from "../components/Detail";
import { Link } from "../components/Link";
import { colors } from "../helpers/theme";
import {
  WEBSITE_URL,
  TWITTER_URL,
  GITHUB_URL,
  BUGS_URL,
  VERSION,
  CONTRACT_URL,
} from "../helpers/constants";

const styles = {
  view: {
    padding: 8,
  },
  warning: {
    color: colors.dfyellow,
  },
  danger: {
    color: colors.dfred,
  },
};

export function HelpView() {
  return (
    <div style={styles.view}>
      <Detail title="version" description={VERSION} />
      <Detail title="website" description={<Link url={WEBSITE_URL} />} />
      <Detail
        title="contract"
        description={<Link url={CONTRACT_URL} text={"Contract"} />}
      />
      <Detail title="github" description={<Link url={GITHUB_URL} />} />
      <Detail title="issues" description={<Link url={BUGS_URL} />} />
      <Detail title="twitter" description={<Link url={TWITTER_URL} />} />

      <br />
      <h1 style={styles.warning}>Warning</h1>
      <p>
        The smart contract written for this project has not been audited, use at
        your own risk.
      </p>
      <br />
      <h1 style={styles.danger}>Danger</h1>
      <p>
        Plugins are evaluated in the context of your game and can access all of
        your private information (including private key!). Plugins can
        dynamically load data, which can be switched out from under you!!! Use
        these plugins at your own risk.
      </p>
      <br />
      <p>
        You should not use any plugins that you haven't written yourself or by
        someone you trust completely. You or someone you trust should control
        the entire pipeline (such as imported dependencies) and should review
        plugins before you use them.
      </p>
    </div>
  );
}
