import React from 'react';
import PropTypes from 'prop-types';
import { downloadBackup, loadLists, loadArchived, loadCustomTags } from '../utils/storage';

// Without this, any render error unmounts the whole app and leaves a blank screen.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return (
      <div className="empty-state-block" role="alert">
        <p className="empty-state">
          Something went wrong and this screen couldn’t be shown. Your data is still saved on
          this device.
        </p>
        <p className="empty-state">
          <code>{error.message || String(error)}</code>
        </p>
        <div className="button-row">
          <button
            type="button"
            className="btn btn-secondary"
            // Reads storage directly: in-memory state may be what broke.
            onClick={() => downloadBackup(loadLists() || [], loadArchived(), loadCustomTags())}
          >
            Download backup
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};

export default ErrorBoundary;
