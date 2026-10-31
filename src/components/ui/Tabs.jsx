// src/components/ui/Tabs.jsx
export function Tabs({ activeKey, onChange, children }) {
  const tabs = children.filter((c) => c.type && c.type.displayName === 'Tab');
  return (
    <div>
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.props.key}
            className={activeKey === tab.props.key ? 'active' : ''}
            onClick={() => onChange(tab.props.key)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {tabs.map((tab) => (
          <div key={tab.props.key} style={{ display: activeKey === tab.props.key ? 'block' : 'none' }}>
            {tab.props.children}
          </div>
        ))}
      </div>
    </div>
  );
}

Tabs.Tab = function Tab({ children, label, key }) {
  this.displayName = 'Tab';
  return null;
};
