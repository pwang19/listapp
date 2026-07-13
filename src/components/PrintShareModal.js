import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { listsToMarkdown, renderMarkdown } from '../utils/helpers';

function PrintShareModal({ isOpen, onClose, lists }) {
  const markdown = useMemo(() => listsToMarkdown(lists), [lists]);
  const [status, setStatus] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setStatus('Markdown copied.');
    } catch {
      setStatus('Could not copy.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lists-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStatus('Download started.');
  };

  const handlePrint = () => {
    const html = renderMarkdown(markdown);
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) {
      setStatus('Pop-up blocked. Allow pop-ups to print.');
      return;
    }
    win.document.write(`<!doctype html><html><head><title>Lists</title>
      <style>
        body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #111; }
        h1,h2 { font-family: system-ui, sans-serif; }
        ul { line-height: 1.5; }
        blockquote { color: #555; border-left: 3px solid #ccc; margin-left: 0; padding-left: 0.75rem; }
      </style></head><body>${html}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setStatus('');
        onClose();
      }}
      title="Print / Share"
      panelClassName="modal-panel--wide"
    >
      <button
        type="button"
        className="icon-button modal-close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      <p className="empty-hint" style={{ fontStyle: 'normal' }}>
        Export a clean Markdown snapshot for sharing or printing.
      </p>

      <pre className="share-preview">{markdown}</pre>

      {status ? <p className="form-feedback form-feedback--ok">{status}</p> : null}

      <div className="button-row button-row--wrap">
        <button type="button" className="btn btn-secondary" onClick={handleCopy}>
          Copy Markdown
        </button>
        <button type="button" className="btn btn-secondary" onClick={handleDownload}>
          Download .md
        </button>
        <button type="button" className="btn btn-primary" onClick={handlePrint}>
          Print
        </button>
      </div>
    </Modal>
  );
}

PrintShareModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lists: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default PrintShareModal;
