import React from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import { computeListStats } from '../../utils/listStats';

function StatCard({ label, value, hint }) {
  return (
    <div className="stat-card">
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
      {hint ? <span className="stat-card-hint">{hint}</span> : null}
    </div>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  hint: PropTypes.string,
};

function ListStatsModal({ isOpen, list, onClose }) {
  if (!list) return null;
  const stats = computeListStats(list);

  return (
    <Modal isOpen={isOpen} onClose={onClose} panelClassName="modal-panel--medium">
      <h2 className="modal-title">
        {list.icon} {list.name} — Stats
      </h2>
      <div className="stats-grid">
        <StatCard label="Total items" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard
          label="Completion rate"
          value={`${stats.completionRate}%`}
          hint={stats.total ? undefined : 'No items yet'}
        />
        <StatCard
          label="Overdue"
          value={stats.overdue}
          hint={stats.overdue > 0 ? 'Needs attention' : undefined}
        />
        <StatCard label="Due this week" value={stats.dueThisWeek} />
        <StatCard
          label="Avg days to complete"
          value={stats.avgDaysToComplete ?? '—'}
          hint={stats.avgDaysToComplete == null ? 'Complete items with dates to track' : undefined}
        />
        <StatCard label="With due dates" value={stats.withDueDate} />
        <StatCard label="Tagged items" value={stats.tagged} />
        <StatCard label="With sub-items" value={stats.withSubItems} />
      </div>
      <div className="button-row">
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      </div>
    </Modal>
  );
}

ListStatsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  list: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default ListStatsModal;
