import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import ConfirmModal from './ConfirmModal';
import { remindersUnavailableReason, remindersEnabled } from '../../utils/push';

export const SYNC_STATUS_LABELS = {
  'signed-out': 'Not syncing',
  syncing: 'Syncing…',
  synced: 'Synced',
  offline: 'Offline',
  error: 'Sync error',
};

const formatSavedAt = (iso) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

function SyncModal({ isOpen, onClose, sync, onRestore }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [versions, setVersions] = useState(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [reminders, setReminders] = useState(false);
  const remindersBlocked = remindersUnavailableReason();

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    remindersEnabled().then((on) => !cancelled && setReminders(on), () => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setCode('');
    setCodeSent(false);
    setFeedback('');
    setVersions(null);
    setPendingRestore(null);
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

  // Called straight from the click: Safari only prompts for permission inside a user gesture.
  const toggleReminders = (on) =>
    attempt(async () => {
      if (on) await sync.enableReminders();
      else await sync.disableReminders();
      setReminders(on);
    });

  const showVersions = () =>
    attempt(async () => {
      setVersions(await sync.listHistory());
    });

  const confirmRestore = () => {
    const version = pendingRestore;
    setPendingRestore(null);
    attempt(async () => {
      onRestore(await sync.fetchHistoryDoc(version.id));
      onClose();
    });
  };

  const signedIn = Boolean(sync.email);

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--narrow" title="Sync">
      {signedIn ? (
        <>
          <p className="modal-hint">
            Signed in as <strong>{sync.email}</strong>. Lists, archive, tags, templates, and
            preferences like saved views sync across your devices; display settings stay on each
            device.
          </p>
          <p className="modal-hint" role="status">Status: {SYNC_STATUS_LABELS[sync.status]}</p>
          {sync.error ? <p className="form-feedback form-feedback--error">{sync.error}</p> : null}
          <div className="field">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={reminders}
                disabled={busy || Boolean(remindersBlocked)}
                onChange={(e) => toggleReminders(e.target.checked)}
              />
              Daily reminder at 8am on this device
            </label>
            <p className="modal-hint">
              {remindersBlocked ||
                'A morning notification listing what’s due today and overdue, only on days with something due.'}
            </p>
          </div>
          <div className="field">
            {versions === null ? (
              <button type="button" className="btn-link history-toggle" onClick={showVersions} disabled={busy}>
                ▸ Earlier versions
              </button>
            ) : versions.length === 0 ? (
              <p className="modal-hint">
                No earlier versions yet. A copy is kept at most every 10 minutes while you edit.
              </p>
            ) : (
              <>
                <span className="field-label">Earlier versions</span>
                <ul className="item-history-list">
                  {versions.map((v) => (
                    <li key={v.id} className="item-history-entry">
                      <span className="item-history-detail">
                        {formatSavedAt(v.saved_at)}
                        <span className="item-history-time">
                          {' '}· {v.list_count} lists · {v.item_count} items
                        </span>
                      </span>
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => setPendingRestore(v)}
                        disabled={busy}
                      >
                        Restore
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
          {feedback ? <p className="form-feedback form-feedback--error">{feedback}</p> : null}
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
      <ConfirmModal
        isOpen={pendingRestore !== null}
        message={
          pendingRestore
            ? `Replace your lists, archive, and tags with the version from ${formatSavedAt(pendingRestore.saved_at)}? You can undo this with ⌘Z.`
            : ''
        }
        confirmLabel="Restore"
        onConfirm={confirmRestore}
        onCancel={() => setPendingRestore(null)}
      />
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
    listHistory: PropTypes.func.isRequired,
    fetchHistoryDoc: PropTypes.func.isRequired,
    requestCode: PropTypes.func.isRequired,
    verifyCode: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired,
  }).isRequired,
  onRestore: PropTypes.func.isRequired,
};

export default SyncModal;
