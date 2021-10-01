import { h } from "preact";

export function Input({
  value,
  onChange,
  style,
  type = "text",
  placeholder = "",
  step,
  min,
}) {
  const inputStyle = {
    outline: "none",
    background: "rgb(21, 21, 21)",
    color: "rgb(131, 131, 131)",
    borderRadius: "4px",
    border: "1px solid rgb(95, 95, 95)",
    padding: "0 4px",
    ...style,
  };

  return (
    <input
      style={inputStyle}
      type={type}
      step={step}
      min={min}
      value={value}
      placeholder={placeholder}
      onInput={(e) => onChange(e.target.value)}
    />
  );
}
