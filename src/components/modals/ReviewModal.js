import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { buildReviewData } from '../../utils/review';

function ReviewSection({ title, rows, onItemClick, emptyText }) {
  return (
    <section className="review-section">
      <h3 className="review-section-title">{title} <span className="review-count">{rows.length}</span></h3>
      {rows.length === 0 ? (
        <p className="empty-hint">{emptyText}</p>
      ) : (
        <ul className="review-list">
          {rows.map(({ listId, listName, listIcon, item }) => (
            <li key={`${listId}-${item.id}`}>
              <button type="button" className="review-item-btn" onClick={() => onItemClick(listId, item.id)}>
                <span className="review-list-label">{listIcon} {listName}</span>
                <span className="review-item-text">{item.text}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

ReviewSection.propTypes = {
  title: PropTypes.string.isRequired,
  rows: PropTypes.array.isRequired,
  onItemClick: PropTypes.func.isRequired,
  emptyText: PropTypes.string.isRequired,
};

function ReviewModal({ isOpen, onClose, lists, staleThresholdDays, onItemClick, onComplete }) {
  const data = useMemo(
    () => buildReviewData(lists, { staleThresholdDays }),
    [lists, staleThresholdDays]
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--wide">
      <h2 className="modal-title">Weekly review</h2>
      <p className="modal-hint">Overdue, blocked, stale, and wins from this week.</p>
      <ReviewSection title="Overdue" rows={data.overdue} onItemClick={onItemClick} emptyText="Nothing overdue." />
      <ReviewSection title="Blocked" rows={data.blocked} onItemClick={onItemClick} emptyText="No blocked items." />
      <ReviewSection title="Stale" rows={data.stale} onItemClick={onItemClick} emptyText="Nothing stale." />
      <ReviewSection
        title="Completed this week"
        rows={data.completedThisWeek}
        onItemClick={onItemClick}
        emptyText="No completions yet this week."
      />
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onComplete}>Mark review done</button>
      </div>
    </Modal>
  );
}

ReviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  lists: PropTypes.array.isRequired,
  staleThresholdDays: PropTypes.number,
  onItemClick: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
};

export default ReviewModal;
