import { motion } from 'framer-motion';
import {
  GraduationCap,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../ui';
import type { College, Essay } from '../../types';

interface StatsOverviewProps {
  colleges: College[];
  essays: Essay[];
}

export function StatsOverview({ colleges, essays }: StatsOverviewProps) {
  const totalColleges = colleges.length;
  const submitted = colleges.filter((c) => c.status === 'submitted' || c.status === 'decided').length;
  const inProgress = colleges.filter((c) => c.status === 'in_progress').length;

  const upcomingDeadlines = colleges.filter((c) => {
    if (!c.deadline || c.status === 'submitted' || c.status === 'decided') return false;
    const daysUntil = Math.ceil(
      (new Date(c.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil <= 14 && daysUntil >= 0;
  }).length;

  const totalEssays = essays.length;

  const stats = [
    {
      label: 'Total Colleges',
      value: totalColleges,
      icon: GraduationCap,
      color: 'bg-primary-100 text-primary-600',
    },
    {
      label: 'Submitted',
      value: submitted,
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-600',
    },
    {
      label: 'Upcoming Deadlines',
      value: upcomingDeadlines,
      icon: AlertTriangle,
      color: 'bg-red-100 text-red-600',
    },
    {
      label: 'Total Essays',
      value: totalEssays,
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
