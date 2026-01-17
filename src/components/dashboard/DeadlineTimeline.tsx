import { motion } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui';
import { formatDate, daysUntil, getDeadlineColor } from '../../lib/utils';
import type { College } from '../../types';

interface DeadlineTimelineProps {
  colleges: College[];
}

export function DeadlineTimeline({ colleges }: DeadlineTimelineProps) {
  // Filter colleges with deadlines and not yet submitted/decided
  const upcomingDeadlines = colleges
    .filter(
      (c) =>
        c.deadline &&
        c.status !== 'submitted' &&
        c.status !== 'decided' &&
        daysUntil(c.deadline) >= 0
    )
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 5);

  if (upcomingDeadlines.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            Upcoming Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
            <p className="text-gray-600">No upcoming deadlines!</p>
            <p className="text-sm text-gray-400 mt-1">
              Add colleges to track their deadlines
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          Upcoming Deadlines
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {upcomingDeadlines.map((college, index) => {
            const days = daysUntil(college.deadline!);
            const isUrgent = days <= 7;

            return (
              <motion.div
                key={college.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                {/* Timeline indicator */}
                <div className="relative flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      isUrgent ? 'bg-red-500' : 'bg-primary-500'
                    }`}
                  />
                  {index < upcomingDeadlines.length - 1 && (
                    <div className="absolute top-3 w-px h-full bg-gray-200" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {college.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {college.decisionType} - {college.applicationType}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right">
                  <p className={`font-medium ${getDeadlineColor(college.deadline!)}`}>
                    {days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `${days} days`}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(college.deadline!)}
                  </p>
                </div>

                {/* Urgent indicator */}
                {isUrgent && (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                )}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
