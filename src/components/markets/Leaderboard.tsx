import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target, Medal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../ui';
import { formatCredits } from '../../lib/utils';
import type { UserStats } from '../../types';

interface LeaderboardProps {
  topPredictors: (UserStats & { username: string })[];
  userRank?: number;
}

export function Leaderboard({ topPredictors, userRank }: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center text-gray-500 font-medium">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-white border-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top Predictors
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {topPredictors.map((predictor, index) => (
            <motion.div
              key={predictor.userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 px-6 py-4 ${getRankBg(predictor.rank)}`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                {getRankIcon(predictor.rank)}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {predictor.username}
                </p>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {predictor.correctPredictions}/{predictor.totalBets}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {(predictor.accuracyRate * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Credits Won */}
              <div className="text-right">
                <p className="font-bold text-green-600">
                  +{formatCredits(predictor.totalCreditsWon)} CC
                </p>
                <p className="text-xs text-gray-500">won</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Your Rank */}
        {userRank && userRank > 10 && (
          <div className="px-6 py-4 bg-primary-50 border-t border-primary-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-primary-700">Your Rank</span>
              <Badge variant="primary">#{userRank}</Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
