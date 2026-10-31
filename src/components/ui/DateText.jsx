// src/components/ui/DateText.jsx
import { dateShort } from '../../lib/format';

export function DateText({ value, className }) {
  return <span className={`date-text ${className || ''}`}>{dateShort(value)}</span>;
}
