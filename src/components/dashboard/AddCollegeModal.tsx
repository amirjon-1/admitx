import { useState } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { generateId } from '../../lib/utils';
import type { College } from '../../types';

interface AddCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (college: College) => void;
}

const POPULAR_COLLEGES = [
  'Harvard',
  'Stanford',
  'MIT',
  'Yale',
  'Princeton',
  'Columbia',
  'UPenn',
  'Duke',
  'Northwestern',
  'Caltech',
  'Brown',
  'Dartmouth',
  'Cornell',
  'Rice',
  'Vanderbilt',
  'UCLA',
  'UC Berkeley',
  'USC',
  'NYU',
  'Georgetown',
];

const DECISION_TYPES = [
  { value: 'ED', label: 'Early Decision (ED)' },
  { value: 'ED2', label: 'Early Decision II (ED2)' },
  { value: 'EA', label: 'Early Action (EA)' },
  { value: 'REA', label: 'Restrictive Early Action (REA)' },
  { value: 'RD', label: 'Regular Decision (RD)' },
];

const APPLICATION_TYPES = [
  { value: 'Common App', label: 'Common App' },
  { value: 'Coalition', label: 'Coalition' },
  { value: 'UC Application', label: 'UC Application' },
  { value: 'Direct', label: 'Direct Application' },
  { value: 'QuestBridge', label: 'QuestBridge' },
];

export function AddCollegeModal({ isOpen, onClose, onAdd }: AddCollegeModalProps) {
  const [name, setName] = useState('');
  const [customName, setCustomName] = useState('');
  const [deadline, setDeadline] = useState('');
  const [decisionType, setDecisionType] = useState('RD');
  const [applicationType, setApplicationType] = useState('Common App');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const collegeName = name === 'other' ? customName : name;

    const college: College = {
      id: generateId(),
      userId: 'demo-user',
      name: collegeName,
      deadline: deadline ? new Date(deadline) : null,
      decisionType: decisionType as College['decisionType'],
      applicationType,
      status: 'not_started',
      result: null,
      createdAt: new Date(),
    };

    onAdd(college);
    setIsSubmitting(false);
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setCustomName('');
    setDeadline('');
    setDecisionType('RD');
    setApplicationType('Common App');
  };

  const collegeOptions = [
    { value: '', label: 'Select a college...' },
    ...POPULAR_COLLEGES.map((c) => ({ value: c, label: c })),
    { value: 'other', label: 'Other (type custom name)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add College"
      description="Track your application to a new college"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="College"
          options={collegeOptions}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {name === 'other' && (
          <Input
            label="College Name"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Enter college name"
            required
          />
        )}

        <Input
          label="Application Deadline"
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <Select
          label="Decision Type"
          options={DECISION_TYPES}
          value={decisionType}
          onChange={(e) => setDecisionType(e.target.value)}
        />

        <Select
          label="Application Type"
          options={APPLICATION_TYPES}
          value={applicationType}
          onChange={(e) => setApplicationType(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!name || (name === 'other' && !customName)}
            isLoading={isSubmitting}
          >
            Add College
          </Button>
        </div>
      </form>
    </Modal>
  );
}
