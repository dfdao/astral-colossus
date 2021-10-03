import { h } from "preact";
import { useState } from "preact/hooks";
import { colors } from "../helpers/theme";
import { Button } from "../components/Button";
import { useContributions, useStore } from "../hooks";

const styles = {
  container: {
    position: "relative",
    height: "100%",
  },
  content: {
    paddingBottom: "44px",
    height: "100%",
    overflowY: "scroll",
  },
  tabs: {
    display: "grid",
    position: "absolute",
    padding: "8px",
    gridColumnGap: "8px",
    justifyContent: "flex-start",
    gridTemplateColumns: "auto auto auto 1fr",
    alignItems: "center",
    bottom: 0,
    width: "100%",
    background: colors.background,
    borderTop: `1px solid ${colors.borderlight}`,
  },
};

export function Navigation({ tabs }) {
  const { isContributing } = useStore();
  const { contributions } = useContributions();
  const [activeTab, setActiveTab] = useState(tabs[0].name);
  const { TabContent } = tabs.find((tab) => tab.name === activeTab);

  const styleTab = (isActive) => ({
    color: isActive ? colors.dfwhite : colors.muted,
    background: colors.background,
  });

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <TabContent />
      </div>
      <div style={styles.tabs}>
        {tabs.map((tab) => (
          <Button
            key={tab.name}
            style={styleTab(tab.name === activeTab)}
            onClick={() => setActiveTab(tab.name)}
            children={tab.name}
            disabled={isContributing}
          />
        ))}
        <div style={{ textAlign: "right" }}>
          {contributions ? contributions : null}
        </div>
      </div>
    </div>
  );
}
