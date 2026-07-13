import React, { useState, useEffect, useId } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import EditableText from './EditableText';
import ConfirmModal from './ConfirmModal';
import Modal from './Modal';
import SortableRow from './SortableRow';
import { TAG_PALETTE } from '../utils/constants';
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
  subItems = [],
  onClose,
  onDelete,
  onSaveChanges,
  onNameChange,
  onAddSubItem,
  onToggleSubItem,
  onDeleteSubItem,
  onReorderSubItems,
}) {
  const [descriptionValue, setDescriptionValue] = useState(description || '');
  const [dueDateValue, setDueDateValue] = useState(dueDate || '');
  const [tagsValue, setTagsValue] = useState(tags || []);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [subItemInput, setSubItemInput] = useState('');
  const [previewMarkdown, setPreviewMarkdown] = useState(false);
  const descId = useId();
  const dueId = useId();
  const subInputId = useId();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  useEffect(() => {
    if (isOpen) {
      setDescriptionValue(description || '');
      setDueDateValue(dueDate || '');
      setTagsValue(tags || []);
      setSubItemInput('');
      setConfirmDeleteOpen(false);
      setPreviewMarkdown(false);
    }
  }, [isOpen, description, dueDate, tags]);

  const handleSave = () => {
    onSaveChanges({
      description: descriptionValue,
      dueDate: dueDateValue,
      tags: tagsValue,
    });
    onClose();
  };

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
    setTagsValue((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
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

        <h2 className="modal-title modal-title--editable">
          <EditableText
            value={itemName}
            onSave={onNameChange}
            style={{ fontSize: '1.5rem', fontWeight: 'bold' }}
          />
        </h2>

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
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder="Add notes… supports **bold**, lists, links"
              className="description-textarea"
            />
          )}
        </div>

        <div className="field">
          <label htmlFor={dueId}>Due date</label>
          <input
            id={dueId}
            type="date"
            value={dueDateValue}
            onChange={(e) => setDueDateValue(e.target.value)}
            className="text-input"
          />
        </div>

        <div className="field">
          <span className="field-label">Tags</span>
          <div className="tag-picker">
            {TAG_PALETTE.map((tag) => {
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
        </div>

        <div className="field">
          <span className="field-label" id={`${subInputId}-label`}>
            Sub-items
          </span>
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
                        <div
                          className={`subitem-row${subItem.complete ? ' is-complete' : ''}`}
                        >
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

        <div className="button-row button-row--spread">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Archive
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            Save Changes
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
  subItems: PropTypes.arrayOf(subItemShape),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSaveChanges: PropTypes.func.isRequired,
  onNameChange: PropTypes.func.isRequired,
  onAddSubItem: PropTypes.func.isRequired,
  onToggleSubItem: PropTypes.func.isRequired,
  onDeleteSubItem: PropTypes.func.isRequired,
  onReorderSubItems: PropTypes.func.isRequired,
};

export default ListItemModal;
