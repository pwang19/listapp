import React from 'react';
import PropTypes from 'prop-types';

function LiveRegion({ message }) {
  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message || ''}
    </div>
  );
}

LiveRegion.propTypes = {
  message: PropTypes.string,
};

export default LiveRegion;
