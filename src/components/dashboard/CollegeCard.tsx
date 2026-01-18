import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card, Badge, Progress } from '../ui';
import {
  formatDateShort,
  getDaysUntilText,
  getDeadlineColor,
  getCollegeLogo,
} from '../../lib/utils';
import type { College, Requirement } from '../../types';

interface CollegeCardProps {
  college: College;
  requirements?: Requirement[];
  onClick?: () => void;
}

export function CollegeCard({ college, requirements = [], onClick }: CollegeCardProps) {
  const completedReqs = requirements.filter((r) => r.isCompleted).length;
  const totalReqs = requirements.length;
  const progress = totalReqs > 0 ? Math.round((completedReqs / totalReqs) * 100) : 0;

  const logo = getCollegeLogo(college.name);

  const statusLabels: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    submitted: 'Submitted',
    decided: 'Decided',
  };

  const resultLabels: Record<string, string> = {
    accepted: 'Accepted',
    rejected: 'Rejected',
    waitlisted: 'Waitlisted',
    deferred: 'Deferred',
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card
        className="p-5 cursor-pointer hover:shadow-md transition-shadow"
        onClick={onClick}
      >
        <div className="flex items-start gap-4 mb-4">
          {/* Logo Section */}
          <div className="flex-shrink-0">
            {logo ? (
              <img
                src={logo}
                alt={college.name}
                className="w-20 h-20 rounded-lg object-contain bg-gray-100 p-2"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    const fallback = document.createElement('div');
                    fallback.className = 'w-20 h-20 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center';
                    fallback.innerHTML = `<span class="text-2xl font-bold text-primary-600">${college.name[0]}</span>`;
                    parent.appendChild(fallback);
                  }
                }}
              />
            ) : null}
            {!logo && (
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-600">
                  {college.name[0]}
                </span>
              </div>
            )}
          </div>

          {/* College Info and Status */}
          <div className="flex-1 flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">{college.name}</h3>
              <p className="text-sm text-gray-500 font-medium">{college.decisionType}</p>
            </div>

            <div className="flex items-center gap-2">
              {college.result ? (
                <Badge
                  variant={
                    college.result === 'accepted'
                      ? 'success'
                      : college.result === 'rejected'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {resultLabels[college.result]}
                </Badge>
              ) : (
                <Badge
                  variant={
                    college.status === 'submitted'
                      ? 'success'
                      : college.status === 'in_progress'
                      ? 'info'
                      : 'default'
                  }
                  size="sm"
                >
                  {statusLabels[college.status]}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Deadline */}
        {college.deadline && college.status !== 'submitted' && college.status !== 'decided' && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">
              {formatDateShort(college.deadline)}
            </span>
            <span className={getDeadlineColor(college.deadline)}>
              ({getDaysUntilText(college.deadline)})
            </span>
          </div>
        )}

        {/* Progress */}
        {totalReqs > 0 && college.status !== 'decided' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Requirements</span>
              <span className="text-gray-900 font-medium">
                {completedReqs}/{totalReqs}
              </span>
            </div>
            <Progress
              value={progress}
              size="sm"
              color={progress === 100 ? 'success' : 'primary'}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-sm text-gray-500">{college.applicationType}</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>
    </motion.div>
  );
}
