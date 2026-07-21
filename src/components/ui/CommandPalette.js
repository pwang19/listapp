import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Modal from '../modals/Modal';

function CommandPalette({ isOpen, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  const filtered = commands.filter((cmd) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.keywords || '').toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const run = (cmd) => {
    cmd.action();
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlight]) {
      e.preventDefault();
      run(filtered[highlight]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--medium command-palette">
      <input
        ref={inputRef}
        type="search"
        className="text-input command-palette-input"
        placeholder="Type a command…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        aria-label="Command palette search"
      />
      <ul className="command-palette-list" role="listbox">
        {filtered.length === 0 ? (
          <li className="command-palette-empty">No commands found</li>
        ) : (
          filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === highlight}
                className={`command-palette-item${i === highlight ? ' is-highlighted' : ''}`}
                onClick={() => run(cmd)}
                onMouseEnter={() => setHighlight(i)}
              >
                <span>{cmd.label}</span>
                {cmd.shortcut ? <kbd>{cmd.shortcut}</kbd> : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </Modal>
  );
}

CommandPalette.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  commands: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      keywords: PropTypes.string,
      shortcut: PropTypes.string,
      action: PropTypes.func.isRequired,
    })
  ).isRequired,
};

export default CommandPalette;
