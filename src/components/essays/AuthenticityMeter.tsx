import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '../ui';
import { cn } from '../../lib/utils';

interface AuthenticityMeterProps {
  score: number | null;
  isLoading?: boolean;
}

export function AuthenticityMeter({ score, isLoading }: AuthenticityMeterProps) {
  const getScoreInfo = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Highly Authentic',
        description: 'Your essay sounds genuinely like you',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        barColor: 'bg-green-500',
        icon: CheckCircle,
      };
    }
    if (score >= 70) {
      return {
        label: 'Mostly Authentic',
        description: 'Minor areas could use more personal voice',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100',
        barColor: 'bg-yellow-500',
        icon: Shield,
      };
    }
    if (score >= 50) {
      return {
        label: 'Needs Improvement',
        description: 'Essay may sound generic or over-polished',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        barColor: 'bg-orange-500',
        icon: AlertTriangle,
      };
    }
    return {
      label: 'AI Detected',
      description: 'Essay may appear AI-generated to reviewers',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      barColor: 'bg-red-500',
      icon: XCircle,
    };
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  if (score === null) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">Authenticity Score</h4>
            <p className="text-sm text-gray-500">
              Analyze your essay to get an authenticity score
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const info = getScoreInfo(score);
  const Icon = info.icon;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-6">
        {/* Circular Score */}
        <div className="relative">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="8"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke={score >= 85 ? '#22c55e' : score >= 70 ? '#eab308' : score >= 50 ? '#f97316' : '#ef4444'}
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 226' }}
              animate={{ strokeDasharray: `${(score / 100) * 226} 226` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-2xl font-bold', info.color)}>{score}</span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Icon className={cn('w-5 h-5', info.color)} />
            <h4 className={cn('font-semibold', info.color)}>{info.label}</h4>
          </div>
          <p className="text-sm text-gray-600">{info.description}</p>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={cn('h-full rounded-full', info.barColor)}
                initial={{ width: 0 }}
                animate={{ width: `${score}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-400">
              <span>AI-like</span>
              <span>Authentic</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
