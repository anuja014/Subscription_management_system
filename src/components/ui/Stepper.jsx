// src/components/ui/Stepper.jsx
import { statusLabel } from '../../lib/format';

const STEPS = ['draft', 'quotation', 'confirmed', 'active', 'closed'];

export function Stepper({ status }) {
  const current = STEPS.indexOf(status);
  return (
    <div className="stepper">
      {STEPS.map((step, i) => {
        let state = 'pending';
        if (i === current) state = 'active';
        if (i < current) state = 'completed';
        return (
          <div key={step} className={`step ${state}`}>
            <div className="dot">{i + 1}</div>
            <span>{statusLabel(step)}</span>
            {i < STEPS.length - 1 && <div className="step-line" />}
          </div>
        );
      })}
    </div>
  );
}
