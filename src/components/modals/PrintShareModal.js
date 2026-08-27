import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { listsToMarkdown, renderMarkdown } from '../../utils/helpers';
import { listsToChecklistHtml, printHtmlDocument } from '../../utils/printLayouts';

function PrintShareModal({ isOpen, onClose, lists }) {
  const markdown = useMemo(() => listsToMarkdown(lists), [lists]);
  const checklistHtml = useMemo(() => listsToChecklistHtml(lists), [lists]);
  const [status, setStatus] = useState('');
  const [layout, setLayout] = useState('markdown');

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

  const handlePrintMarkdown = () => {
    const html = renderMarkdown(markdown);
    const doc = `<!doctype html><html><head><title>Lists</title>
      <style>
        body { font-family: Georgia, serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; color: #111; }
        h1,h2 { font-family: system-ui, sans-serif; }
        ul { line-height: 1.5; }
        blockquote { color: #555; border-left: 3px solid #ccc; margin-left: 0; padding-left: 0.75rem; }
      </style></head><body>${html}</body></html>`;
    if (!printHtmlDocument(doc)) {
      setStatus('Pop-up blocked. Allow pop-ups to print.');
    }
  };

  const handlePrintChecklist = () => {
    if (!printHtmlDocument(checklistHtml)) {
      setStatus('Pop-up blocked. Allow pop-ups to print.');
      return;
    }
    setStatus('Checklist print opened.');
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

      <div className="field">
        <span className="field-label">Layout</span>
        <div className="filter-group" role="group" aria-label="Print layout">
          <button
            type="button"
            className={`chip-btn${layout === 'markdown' ? ' is-active' : ''}`}
            onClick={() => setLayout('markdown')}
          >
            Markdown
          </button>
          <button
            type="button"
            className={`chip-btn${layout === 'checklist' ? ' is-active' : ''}`}
            onClick={() => setLayout('checklist')}
          >
            Checklist
          </button>
        </div>
      </div>

      <p className="empty-hint" style={{ fontStyle: 'normal' }}>
        {layout === 'checklist'
          ? 'Print-friendly layout with checkbox rows — great for paper lists.'
          : 'Export a clean Markdown snapshot for sharing or printing.'}
      </p>

      {layout === 'markdown' ? (
        <pre className="share-preview">{markdown}</pre>
      ) : (
        <div
          className="share-preview checklist-preview"
          dangerouslySetInnerHTML={{ __html: checklistHtml.match(/<body>([\s\S]*)<\/body>/)?.[1] || '' }}
        />
      )}

      {status ? <p className="form-feedback form-feedback--ok">{status}</p> : null}

      <div className="button-row button-row--wrap">
        {layout === 'markdown' ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={handleCopy}>
              Copy Markdown
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleDownload}>
              Download .md
            </button>
            <button type="button" className="btn btn-primary" onClick={handlePrintMarkdown}>
              Print
            </button>
          </>
        ) : (
          <button type="button" className="btn btn-primary" onClick={handlePrintChecklist}>
            Print checklist
          </button>
        )}
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
