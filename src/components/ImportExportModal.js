import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';

function ImportExportModal({
  isOpen,
  jsonData,
  onClose,
  onImport,
  hasExistingLists,
  onBackup,
}) {
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [confirmMode, setConfirmMode] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setJsonText(jsonData);
      setError('');
      setStatus('');
      setConfirmMode(null);
      setPendingImport(null);
    }
  }, [isOpen, jsonData]);

  const applyImport = (parsed, mode, migrateLegacyPriorities = false) => {
    const result = onImport(parsed, mode, { migrateLegacyPriorities });
    if (!result || !result.ok) {
      setError((result && result.error) || 'Import failed.');
      return false;
    }
    setError('');
    setStatus('');
    onClose();
    return true;
  };

  const parseInput = () => {
    setError('');
    setStatus('');
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setError('Invalid JSON format. Check your JSON and try again.');
      return null;
    }
    let lists;
    let migrateLegacyPriorities = true;
    if (Array.isArray(parsed)) {
      lists = parsed;
    } else if (Array.isArray(parsed.lists)) {
      lists = parsed.lists;
      migrateLegacyPriorities = (parsed.version || 1) < 3;
    } else {
      setError('Imported data must be a JSON array of lists.');
      return null;
    }
    return { lists, migrateLegacyPriorities };
  };

  const handleReplaceClick = () => {
    const parsed = parseInput();
    if (!parsed) return;
    if (hasExistingLists) {
      setPendingImport(parsed);
      setConfirmMode('replace');
      return;
    }
    applyImport(parsed.lists, 'replace', parsed.migrateLegacyPriorities);
  };

  const handleMergeClick = () => {
    const parsed = parseInput();
    if (!parsed) return;
    if (hasExistingLists) {
      setPendingImport(parsed);
      setConfirmMode('merge');
      return;
    }
    applyImport(parsed.lists, 'replace', parsed.migrateLegacyPriorities);
  };

  const handleConfirm = () => {
    const mode = confirmMode;
    setConfirmMode(null);
    if (pendingImport) {
      applyImport(
        pendingImport.lists,
        mode,
        pendingImport.migrateLegacyPriorities
      );
    }
    setPendingImport(null);
  };

  const handleCancelConfirm = () => {
    setConfirmMode(null);
    setPendingImport(null);
  };

  const handleCopy = async () => {
    setError('');
    try {
      await navigator.clipboard.writeText(jsonText);
      setStatus('Copied to clipboard.');
    } catch {
      setError('Could not copy to clipboard.');
    }
  };

  const handleDownload = () => {
    setError('');
    try {
      const blob = new Blob([jsonText], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `listapp-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus('Download started.');
    } catch {
      setError('Could not download file.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setJsonText(JSON.stringify(parsed, null, 2));
          setStatus(`Loaded ${file.name}`);
        } else if (Array.isArray(parsed.lists)) {
          setJsonText(JSON.stringify(parsed, null, 2));
          const migrateLegacyPriorities = (parsed.version || 1) < 3;
          setStatus(
            `Loaded ${file.name}${migrateLegacyPriorities ? ' (legacy priorities will be converted)' : ''}`
          );
        } else {
          setError('Invalid JSON file.');
          return;
        }
        setError('');
      } catch {
        setError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClose = () => {
    if (confirmMode) return;
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Import/Export Lists"
        panelClassName="modal-panel--wide"
      >
        <button
          type="button"
          className="icon-button modal-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="field">
          <label htmlFor="import-export-json">JSON Data</label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
            aria-label="Import JSON file"
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm file-import-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            Choose file…
          </button>
          <textarea
            id="import-export-json"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setError('');
              setStatus('');
            }}
            placeholder="Paste or edit JSON data here..."
            className="json-textarea"
            spellCheck={false}
          />
        </div>

        {error ? (
          <p className="form-feedback form-feedback--error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="form-feedback form-feedback--ok" role="status">
            {status}
          </p>
        ) : null}

        <div className="button-row button-row--wrap">
          <button type="button" className="btn btn-secondary" onClick={handleCopy}>
            Copy
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleDownload}>
            Download
          </button>
          {onBackup ? (
            <button type="button" className="btn btn-secondary" onClick={onBackup}>
              Full backup
            </button>
          ) : null}
          <div className="button-row-spacer" />
          <button type="button" className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleMergeClick}>
            Merge import
          </button>
          <button type="button" className="btn btn-primary" onClick={handleReplaceClick}>
            Replace import
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmMode === 'replace'}
        message="Replace import will overwrite all current lists. Continue?"
        confirmLabel="Replace"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
      <ConfirmModal
        isOpen={confirmMode === 'merge'}
        message="Merge import will combine lists by id/name. Continue?"
        confirmLabel="Merge"
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </>
  );
}

ImportExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  jsonData: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onImport: PropTypes.func.isRequired,
  hasExistingLists: PropTypes.bool,
  onBackup: PropTypes.func,
};

export default ImportExportModal;
