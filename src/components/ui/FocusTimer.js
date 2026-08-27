import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

function FocusTimer({
  minutes,
  remaining,
  running,
  listName,
  onStart,
  onPause,
  onReset,
}) {
  const display = remaining > 0 ? remaining : minutes * 60;
  const mins = Math.floor(display / 60);
  const secs = display % 60;

  useEffect(() => {
    if (!running || remaining <= 0) return undefined;
    const id = setInterval(() => {}, 1000);
    return () => clearInterval(id);
  }, [running, remaining]);

  if (!listName) return null;

  return (
    <div className="focus-timer" role="status" aria-live="polite">
      <span className="focus-timer-label">Focus: {listName}</span>
      <span className="focus-timer-clock">{mins}:{String(secs).padStart(2, '0')}</span>
      <div className="focus-timer-actions">
        {running ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onPause}>Pause</button>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={onStart}>Start</button>
        )}
        <button type="button" className="btn-link" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}

FocusTimer.propTypes = {
  minutes: PropTypes.number.isRequired,
  remaining: PropTypes.number.isRequired,
  running: PropTypes.bool.isRequired,
  listName: PropTypes.string,
  onStart: PropTypes.func.isRequired,
  onPause: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
};

export default FocusTimer;
