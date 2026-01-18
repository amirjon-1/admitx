import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Users, Clock } from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { formatCredits, daysUntil, getOddsColor } from '../../lib/utils';
import type { AdmissionsMarket, AnonymousProfile } from '../../types';

interface MarketCardProps {
  market: AdmissionsMarket;
  profile?: AnonymousProfile;
  onBet?: (prediction: 'yes' | 'no') => void;
}

export function MarketCard({ market, profile, onBet }: MarketCardProps) {
  const daysLeft = market.decisionDate ? daysUntil(market.decisionDate) : null;

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-sm text-gray-500">
                  #{market.applicantProfileId}
                </span>
                <span className="text-gray-300">→</span>
                <span className="font-semibold text-gray-900">
                  {market.schoolName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Badge variant="default" size="sm">
                  {market.decisionType}
                </Badge>
                {daysLeft !== null && daysLeft > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {daysLeft} days
                  </span>
                )}
              </div>
            </div>
            <Badge
              variant={market.status === 'open' ? 'success' : market.status === 'resolved' ? 'info' : 'default'}
            >
              {market.status}
            </Badge>
          </div>
        </div>

        {/* Profile Summary */}
        {profile && (
          <div className="px-4 py-3 bg-white border-b border-gray-100">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-gray-900">{profile.gpa}</p>
                <p className="text-xs text-gray-500">GPA</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{profile.testScore}</p>
                <p className="text-xs text-gray-500">{profile.testType}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{profile.apCount}</p>
                <p className="text-xs text-gray-500">APs</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{profile.essayScore}</p>
                <p className="text-xs text-gray-500">Essay</p>
              </div>
            </div>
          </div>
        )}

        {/* Odds Display */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            {/* YES Odds */}
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-600">YES</span>
              </div>
              <p className={`text-3xl font-bold ${getOddsColor(market.currentOddsYes)}`}>
                {market.currentOddsYes}%
              </p>
            </div>

            {/* Divider */}
            <div className="h-16 w-px bg-gray-200 mx-4" />

            {/* NO Odds */}
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium text-gray-600">NO</span>
              </div>
              <p className={`text-3xl font-bold text-gray-600`}>
                {market.currentOddsNo}%
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {market.uniqueParticipants} traders
            </span>
            <span>{formatCredits(market.totalVolume)} CC volume</span>
          </div>

          {/* Betting Buttons */}
          {market.status === 'open' && onBet && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => onBet('yes')}
              >
                Bet YES
              </Button>
              <Button
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => onBet('no')}
              >
                Bet NO
              </Button>
            </div>
          )}

          {/* Resolved State */}
          {market.status === 'resolved' && market.actualResult && (
            <div
              className={`text-center py-3 rounded-lg ${
                market.actualResult === 'accepted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span className="font-semibold">
                Result: {market.actualResult === 'accepted' ? 'ACCEPTED' : 'REJECTED'}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
