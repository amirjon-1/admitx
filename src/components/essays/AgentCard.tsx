import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { Card, Badge } from '../ui';
import { cn } from '../../lib/utils';
import type { AgentType } from '../../types';

interface AgentCardProps {
  name: string;
  type: AgentType;
  icon: string;
  feedback: string | null;
  score?: number | null;
  isLoading: boolean;
  delay?: number;
}

const AGENT_COLORS: Record<AgentType, string> = {
  story: 'from-purple-500 to-purple-600',
  admissions: 'from-blue-500 to-blue-600',
  technical: 'from-green-500 to-green-600',
  authenticity: 'from-orange-500 to-orange-600',
  synthesis: 'from-pink-500 to-pink-600',
};

const AGENT_BG: Record<AgentType, string> = {
  story: 'bg-purple-50 border-purple-200',
  admissions: 'bg-blue-50 border-blue-200',
  technical: 'bg-green-50 border-green-200',
  authenticity: 'bg-orange-50 border-orange-200',
  synthesis: 'bg-pink-50 border-pink-200',
};

export function AgentCard({
  name,
  type,
  icon,
  feedback,
  score,
  isLoading,
  delay = 0,
}: AgentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className={cn('border', AGENT_BG[type])}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-100">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center text-white bg-gradient-to-br',
              AGENT_COLORS[type]
            )}
          >
            <span className="text-xl">{icon}</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{name}</h4>
            <p className="text-xs text-gray-500 capitalize">{type} analysis</p>
          </div>
          {score !== null && score !== undefined && (
            <Badge
              variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'danger'}
            >
              {score}/100
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Analyzing...</span>
            </div>
          ) : feedback ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="prose prose-sm max-w-none"
            >
              <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                {feedback}
              </p>
            </motion.div>
          ) : (
            <p className="text-gray-400 text-center py-4">
              Waiting for analysis...
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
