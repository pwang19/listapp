import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

export const SYNC_STATUS_LABELS = {
  'signed-out': 'Not syncing',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline',
  error: 'Sync error',
};

function SyncModal({ isOpen, onClose, sync }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setCode('');
    setCodeSent(false);
    setFeedback('');
  }, [isOpen]);

  const attempt = async (fn) => {
    setBusy(true);
    setFeedback('');
    try {
      await fn();
    } catch (err) {
      setFeedback(err?.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () =>
    attempt(async () => {
      await sync.requestCode(email.trim());
      setCodeSent(true);
    });

  const confirmCode = () =>
    attempt(async () => {
      await sync.verifyCode(email.trim(), code.trim());
      onClose();
    });

  const signedIn = Boolean(sync.email);

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--narrow" title="Sync">
      {signedIn ? (
        <>
          <p className="modal-hint">
            Signed in as <strong>{sync.email}</strong>. Lists, archive, tags, and templates sync
            across your devices; display settings stay on each device.
          </p>
          <p className="modal-hint" role="status">Status: {SYNC_STATUS_LABELS[sync.status]}</p>
          {sync.error ? <p className="form-feedback form-feedback--error">{sync.error}</p> : null}
          <div className="button-row">
            <button type="button" className="btn btn-secondary" onClick={() => attempt(sync.signOut)}>
              Sign out
            </button>
            <button type="button" className="btn btn-primary" onClick={sync.syncNow}>
              Sync now
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="modal-hint">
            Sign in on each device with the same email to keep your lists in sync. Anything
            already on this device is kept and merged in.
          </p>
          <input
            type="email"
            className="text-input"
            placeholder="you@example.com"
            aria-label="Email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && email.trim() && !codeSent && sendCode()}
            disabled={codeSent}
          />
          {codeSent ? (
            <input
              type="text"
              className="text-input"
              placeholder="Code from the email"
              aria-label="Sign-in code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && code.trim() && confirmCode()}
              autoFocus
            />
          ) : null}
          {feedback ? <p className="form-feedback form-feedback--error">{feedback}</p> : null}
          <div className="button-row">
            {codeSent ? (
              <>
                <button type="button" className="btn btn-secondary" onClick={() => setCodeSent(false)}>
                  Use another email
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={confirmCode}
                  disabled={busy || !code.trim()}
                >
                  Sign in
                </button>
              </>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                onClick={sendCode}
                disabled={busy || !email.trim()}
              >
                Email me a code
              </button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

SyncModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sync: PropTypes.shape({
    email: PropTypes.string,
    status: PropTypes.string.isRequired,
    error: PropTypes.string,
    syncNow: PropTypes.func.isRequired,
    requestCode: PropTypes.func.isRequired,
    verifyCode: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
  }).isRequired,
};

export default SyncModal;
