// src/components/ui/MoneyText.jsx
import { money } from '../../lib/format';

export function MoneyText({ amount, className }) {
  return <span className={`mono ${className || ''}`}>{money(amount)}</span>;
}
