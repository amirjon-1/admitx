import { useEffect, useState } from 'react';
import { Modal, Button, Input, Select } from '../ui';
import { generateId } from '../../lib/utils';
import type { College } from '../../types';
import { useStore } from '../../store/useStore';

import collegeDeadlines from '../../data/college_deadlines.json';
import collegeDecisions from '../../data/college_decisions.json';
import collegeApplications from '../../data/college_applications.json';

interface AddCollegeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (college: College) => void;
}

const DECISION_LABELS: Record<string, string> = {
  ED: 'Early Decision (ED)',
  ED2: 'Early Decision II (ED2)',
  EA: 'Early Action (EA)',
  REA: 'Restrictive Early Action (REA)',
  RD: 'Regular Decision (RD)',
};

export function AddCollegeModal({ isOpen, onClose, onAdd }: AddCollegeModalProps) {
  const { user } = useStore();
  const [name, setName] = useState('');
  const [decisionType, setDecisionType] = useState('RD');
  const [deadline, setDeadline] = useState('');
  const [applicationType, setApplicationType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allowedDecisions =
    (collegeDecisions as Record<string, string[]>)[name] ?? ['RD'];

  const allowedApplications =
    (collegeApplications as Record<string, string[]>)[name] ?? ['Common App'];

  useEffect(() => {
    if (!allowedDecisions.includes(decisionType)) {
      setDecisionType(allowedDecisions[0]);
    }
  }, [name, allowedDecisions]);

  useEffect(() => {
    const deadlines =
      (collegeDeadlines as Record<string, Record<string, string>>)[name];
    if (!deadlines) return;

    const d = deadlines[decisionType] ?? deadlines.RD;
    if (d) setDeadline(d);
  }, [name, decisionType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    onAdd({
      // Use a real UUID when signed-in so Supabase accepts the insert
      id: user?.id ? crypto.randomUUID() : generateId(),
      userId: user?.id || 'demo-user',
      name,
      deadline: deadline ? new Date(deadline) : null,
      decisionType: decisionType as College['decisionType'],
      applicationType,
      status: 'not_started',
      result: null,
      createdAt: new Date(),
    });

    setIsSubmitting(false);
    onClose();
  };

  const collegeOptions = Object.keys(collegeDeadlines).map((college) => ({
    value: college,
    label: college,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add College">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="College"
          options={collegeOptions}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Select
          label="Decision Type"
          options={allowedDecisions.map((d) => ({
            value: d,
            label: DECISION_LABELS[d],
          }))}
          value={decisionType}
          onChange={(e) => setDecisionType(e.target.value)}
        />

        <Input label="Deadline" type="date" value={deadline} readOnly />

        <Select
          label="Application Type"
          options={allowedApplications.map((a) => ({
            value: a,
            label: a,
          }))}
          value={applicationType}
          onChange={(e) => setApplicationType(e.target.value)}
        />

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Add</Button>
        </div>
      </form>
    </Modal>
  );
}
