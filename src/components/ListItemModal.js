import React, { useState, useEffect, useId, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import EditableText from './EditableText';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import SortableRow from './SortableRow';
import { PRIORITIES, RECURRING_OPTIONS } from '../utils/constants';
import { getAllTags } from '../utils/tags';
import { renderMarkdown } from '../utils/helpers';

const subItemShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  complete: PropTypes.bool,
});

function ListItemModal({
  isOpen,
  itemName,
  description,
  dueDate = '',
  tags = [],
  priority = 0,
  recurring = 'none',
  completedAt = '',
  subItems = [],
  customTags = [],
  lists = [],
  currentListId,
  onClose,
  onDelete,
  onSaveChanges,
  onNameChange,
  onDuplicate,
  onMove,
  onAddSubItem,
  onToggleSubItem,
  onDeleteSubItem,
  onReorderSubItems,
  onAddCustomTag,
}) {
  const [descriptionValue, setDescriptionValue] = useState(description || '');
  const [dueDateValue, setDueDateValue] = useState(dueDate || '');
  const [tagsValue, setTagsValue] = useState(tags || []);
  const [priorityValue, setPriorityValue] = useState(priority || 0);
  const [recurringValue, setRecurringValue] = useState(recurring || 'none');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [subItemInput, setSubItemInput] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [savedHint, setSavedHint] = useState(false);
  const descId = useId();
  const dueId = useId();
  const subInputId = useId();
  const saveTimerRef = useRef(null);
  const wasOpenRef = useRef(false);

  const allTags = getAllTags(customTags);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setDescriptionValue(description || '');
      setDueDateValue(dueDate || '');
      setTagsValue(tags || []);
      setPriorityValue(priority || 0);
      setRecurringValue(recurring || 'none');
      setSubItemInput('');
      setConfirmDeleteOpen(false);
      setPreviewMarkdown(false);
      setNewTagInput('');
      setSavedHint(false);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, description, dueDate, tags, priority, recurring]);

  const autoSave = useCallback(
    (patch) => {
      onSaveChanges(patch);
      setSavedHint(true);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSavedHint(false), 1500);
    },
    [onSaveChanges]
  );

  useEffect(() => () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
  }, []);

  const handleConfirmDelete = () => {
    setConfirmDeleteOpen(false);
    onDelete();
    onClose();
  };

  const handleSubItemKeyDown = (event) => {
    if (event.key === 'Enter' && subItemInput.trim() !== '') {
      onAddSubItem(subItemInput.trim());
      setSubItemInput('');
    }
  };

  const toggleTag = (tagId) => {
    const next = tagsValue.includes(tagId)
      ? tagsValue.filter((t) => t !== tagId)
      : [...tagsValue, tagId];
    setTagsValue(next);
    autoSave({ tags: next });
  };

  const handleAddCustomTag = () => {
    const label = newTagInput.trim();
    if (!label) return;
    const tag = onAddCustomTag(label);
    if (tag) {
      const next = [...tagsValue, tag.id];
      setTagsValue(next);
      autoSave({ tags: next });
    }
    setNewTagInput('');
  };

  const handleClose = () => {
    if (confirmDeleteOpen) return;
    onClose();
  };

  const handleSubDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorderSubItems(active.id, over.id);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} panelClassName="modal-panel--medium">
        <button
          type="button"
          className="icon-button modal-close"
          onClick={handleClose}
          aria-label="Close"
        >
          ×
        </button>

        {savedHint ? (
          <span className="autosave-hint" role="status">Saved</span>
        ) : null}

        <h2 className="modal-title modal-title--editable">
          <EditableText
            value={itemName}
            onSave={onNameChange}
            style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
          />
        </h2>

        {completedAt ? (
          <p className="completed-at-hint">Completed {new Date(completedAt).toLocaleString()}</p>
        ) : null}

        <div className="field">
          <div className="field-header">
            <label htmlFor={descId}>Notes (Markdown)</label>
            <button
              type="button"
              className="btn-link"
              onClick={() => setPreviewMarkdown((v) => !v)}
            >
              {previewMarkdown ? 'Edit' : 'Preview'}
            </button>
          </div>
          {previewMarkdown ? (
            <div
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(descriptionValue) }}
            />
          ) : (
            <textarea
              id={descId}
              value={descriptionValue}
              onChange={(e) => {
                setDescriptionValue(e.target.value);
                autoSave({ description: e.target.value });
              }}
              placeholder="Add notes… supports **bold**, lists, links"
              className="description-textarea"
            />
          )}
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={dueId}>Due date</label>
            <input
              id={dueId}
              type="date"
              value={dueDateValue}
              onChange={(e) => {
                setDueDateValue(e.target.value);
                autoSave({ dueDate: e.target.value });
              }}
              className="text-input"
            />
          </div>
          <div className="field">
            <label htmlFor="priority-select">Priority</label>
            <select
              id="priority-select"
              className="style-select"
              value={priorityValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setPriorityValue(val);
                autoSave({ priority: val });
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="recurring-select">Recurring</label>
            <select
              id="recurring-select"
              className="style-select"
              value={recurringValue}
              onChange={(e) => {
                setRecurringValue(e.target.value);
                autoSave({ recurring: e.target.value });
              }}
            >
              {RECURRING_OPTIONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Tags</span>
          <div className="tag-picker">
            {allTags.map((tag) => {
              const active = tagsValue.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-chip tag-chip--picker${active ? ' is-active' : ''}`}
                  style={{
                    backgroundColor: active ? `${tag.color}33` : '#f3f4f6',
                    color: active ? tag.color : '#6b7785',
                    borderColor: active ? tag.color : 'transparent',
                  }}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
          <div className="tag-create-row">
            <input
              type="text"
              className="text-input"
              placeholder="New tag…"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
            />
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddCustomTag}>
              Add
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field-label" id={`${subInputId}-label`}>Sub-items</span>
          <div className="subitems-box" role="group" aria-labelledby={`${subInputId}-label`}>
            {subItems.length === 0 ? (
              <p className="empty-hint">No sub-items yet</p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleSubDragEnd}
              >
                <SortableContext
                  items={subItems.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {subItems.map((subItem) => {
                    const checkboxId = `sub-${subItem.id}`;
                    return (
                      <SortableRow key={subItem.id} id={subItem.id} className="subitem-sortable">
                        <div className={`subitem-row${subItem.complete ? ' is-complete' : ''}`}>
                          <input
                            id={checkboxId}
                            type="checkbox"
                            checked={subItem.complete || false}
                            onChange={() => onToggleSubItem(subItem.id)}
                          />
                          <label htmlFor={checkboxId} className="subitem-label">
                            {subItem.text}
                          </label>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => onDeleteSubItem(subItem.id)}
                            aria-label={`Delete sub-item ${subItem.text}`}
                          >
                            ×
                          </button>
                        </div>
                      </SortableRow>
                    );
                  })}
                </SortableContext>
              </DndContext>
            )}
          </div>
          <input
            id={subInputId}
            type="text"
            value={subItemInput}
            onChange={(e) => setSubItemInput(e.target.value)}
            onKeyDown={handleSubItemKeyDown}
            placeholder="Add a sub-item..."
            aria-label="Add a sub-item"
            className="text-input"
          />
        </div>

        <div className="button-row button-row--spread button-row--wrap">
          <div className="button-row">
            <button type="button" className="btn btn-danger" onClick={() => setConfirmDeleteOpen(true)}>
              Archive
            </button>
            <button type="button" className="btn btn-secondary" onClick={onDuplicate}>
              Duplicate
            </button>
          </div>
          {lists.length > 1 ? (
            <select
              className="style-select"
              value={currentListId}
              onChange={(e) => onMove(e.target.value)}
              aria-label="Move to list"
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
              ))}
            </select>
          ) : null}
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        message={`Archive "${itemName}"? You can restore it from Archived.`}
        confirmLabel="Archive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
}

ListItemModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  itemName: PropTypes.string.isRequired,
  description: PropTypes.string,
  dueDate: PropTypes.string,
  tags: PropTypes.arrayOf(PropTypes.string),
  priority: PropTypes.number,
  recurring: PropTypes.string,
  completedAt: PropTypes.string,
  subItems: PropTypes.arrayOf(subItemShape),
  customTags: PropTypes.array,
  lists: PropTypes.array,
  currentListId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSaveChanges: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func,
  onMove: PropTypes.func,
  onAddSubItem: PropTypes.func.isRequired,
  onToggleSubItem: PropTypes.func.isRequired,
  onDeleteSubItem: PropTypes.func.isRequired,
  onReorderSubItems: PropTypes.func.isRequired,
  onAddCustomTag: PropTypes.func,
};

export default ListItemModal;
