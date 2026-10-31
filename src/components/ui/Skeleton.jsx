// src/components/ui/Skeleton.jsx
export function Skeleton({ className, style }) {
  return <div className={`skeleton ${className || ''}`} style={style} />;
}
