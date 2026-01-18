import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Search,
  Filter,
  Sparkles,
  BarChart3,
  Info,
} from 'lucide-react';
import { Header } from '../components/layout';
import { MarketCard, BettingModal, Leaderboard } from '../components/markets';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
} from '../components/ui';
import { useStore } from '../store/useStore';
import { formatCredits } from '../lib/utils';
import type { AdmissionsMarket, AnonymousProfile, UserStats } from '../types';

// Demo data
const DEMO_MARKETS: AdmissionsMarket[] = [
  {
    id: '1',
    applicantProfileId: 'A7B2',
    schoolName: 'Stanford',
    decisionType: 'REA',
    decisionDate: new Date('2026-12-15'),
    currentOddsYes: 18,
    currentOddsNo: 82,
    totalVolume: 4500,
    uniqueParticipants: 23,
    status: 'open',
    actualResult: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    applicantProfileId: 'K9X3',
    schoolName: 'MIT',
    decisionType: 'EA',
    decisionDate: new Date('2026-12-20'),
    currentOddsYes: 42,
    currentOddsNo: 58,
    totalVolume: 8200,
    uniqueParticipants: 45,
    status: 'open',
    actualResult: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    applicantProfileId: 'M2P8',
    schoolName: 'Harvard',
    decisionType: 'RD',
    decisionDate: new Date('2026-03-28'),
    currentOddsYes: 8,
    currentOddsNo: 92,
    totalVolume: 12500,
    uniqueParticipants: 67,
    status: 'open',
    actualResult: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '4',
    applicantProfileId: 'J5L1',
    schoolName: 'Yale',
    decisionType: 'EA',
    decisionDate: new Date('2025-12-15'),
    currentOddsYes: 35,
    currentOddsNo: 65,
    totalVolume: 3200,
    uniqueParticipants: 18,
    status: 'resolved',
    actualResult: 'accepted',
    resolvedAt: new Date('2025-12-16'),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '5',
    applicantProfileId: 'R4W7',
    schoolName: 'Princeton',
    decisionType: 'RD',
    decisionDate: new Date('2026-03-28'),
    currentOddsYes: 22,
    currentOddsNo: 78,
    totalVolume: 5600,
    uniqueParticipants: 31,
    status: 'open',
    actualResult: null,
    resolvedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const DEMO_PROFILES: Record<string, AnonymousProfile> = {
  'A7B2': {
    id: 'A7B2',
    userId: 'user1',
    gpa: 3.92,
    testScore: 1520,
    testType: 'SAT',
    apCount: 11,
    ecSummary: [
      { category: 'STEM', tier: 'National', leadership: true },
      { category: 'Service', tier: 'Regional', leadership: true },
    ],
    demographics: { state: 'CA', firstGen: false, urm: false },
    essayScore: 78,
    isPublic: true,
    createdAt: new Date(),
  },
  'K9X3': {
    id: 'K9X3',
    userId: 'user2',
    gpa: 4.0,
    testScore: 1580,
    testType: 'SAT',
    apCount: 14,
    ecSummary: [
      { category: 'STEM', tier: 'International', leadership: true },
      { category: 'Leadership', tier: 'National', leadership: true },
    ],
    demographics: { state: 'TX', firstGen: true, urm: false },
    essayScore: 88,
    isPublic: true,
    createdAt: new Date(),
  },
  'M2P8': {
    id: 'M2P8',
    userId: 'user3',
    gpa: 3.78,
    testScore: 1490,
    testType: 'SAT',
    apCount: 9,
    ecSummary: [
      { category: 'Arts', tier: 'State', leadership: false },
      { category: 'Sports', tier: 'Regional', leadership: true },
    ],
    demographics: { state: 'NY', firstGen: false, urm: true },
    essayScore: 72,
    isPublic: true,
    createdAt: new Date(),
  },
};

const DEMO_LEADERBOARD: (UserStats & { username: string })[] = [
  {
    userId: '1',
    username: 'PredictorPro',
    totalBets: 45,
    correctPredictions: 38,
    accuracyRate: 0.84,
    totalCreditsWon: 12500,
    totalCreditsLost: 3200,
    rank: 1,
    updatedAt: new Date(),
  },
  {
    userId: '2',
    username: 'AdmitWhiz',
    totalBets: 62,
    correctPredictions: 49,
    accuracyRate: 0.79,
    totalCreditsWon: 9800,
    totalCreditsLost: 4100,
    rank: 2,
    updatedAt: new Date(),
  },
  {
    userId: '3',
    username: 'StatsSage',
    totalBets: 33,
    correctPredictions: 25,
    accuracyRate: 0.76,
    totalCreditsWon: 7200,
    totalCreditsLost: 2800,
    rank: 3,
    updatedAt: new Date(),
  },
  {
    userId: '4',
    username: 'CollegeOracle',
    totalBets: 28,
    correctPredictions: 20,
    accuracyRate: 0.71,
    totalCreditsWon: 5500,
    totalCreditsLost: 2200,
    rank: 4,
    updatedAt: new Date(),
  },
  {
    userId: '5',
    username: 'DataDrivenDecisions',
    totalBets: 41,
    correctPredictions: 28,
    accuracyRate: 0.68,
    totalCreditsWon: 4800,
    totalCreditsLost: 2600,
    rank: 5,
    updatedAt: new Date(),
  },
];

export function Markets() {
  const { user } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<AdmissionsMarket | null>(null);
  const [selectedPrediction, setSelectedPrediction] = useState<'yes' | 'no' | null>(null);
  const [userCredits, setUserCredits] = useState(1000);

  const handleBetClick = (market: AdmissionsMarket, prediction: 'yes' | 'no') => {
    setSelectedMarket(market);
    setSelectedPrediction(prediction);
  };

  const handlePlaceBet = (amount: number) => {
    setUserCredits((prev) => prev - amount);
    // In production, this would call the API
  };

  const filteredMarkets = DEMO_MARKETS.filter((market) =>
    market.schoolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    market.applicantProfileId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openMarkets = filteredMarkets.filter((m) => m.status === 'open');
  const resolvedMarkets = filteredMarkets.filter((m) => m.status === 'resolved');

  return (
    <div className="min-h-screen">
      <Header
        title="Prediction Markets"
        subtitle="Bet on admission outcomes with Council Credits"
      />

      <div className="p-4 md:p-8">
        {/* Under Construction Banner */}
        <Card className="mb-8 border-2 border-primary-200 bg-gradient-to-r from-primary-50 to-primary-100">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-3 rounded-lg bg-primary-500 text-white">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  🚧 Under Construction
                </h3>
                <p className="text-gray-700 mb-3">
                  We're building the newest way to bet on each other's potential future colleges. 
                  Prediction markets are coming soon!
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-semibold">What to expect:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Bet on admission outcomes using Council Credits</li>
                    <li>Real-time odds based on community predictions</li>
                    <li>Win credits when your predictions are correct</li>
                    <li>Anonymous profiles to protect privacy</li>
                    <li>Leaderboards to track the best predictors</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCredits(userCredits)}
                </p>
                <p className="text-xs text-gray-500">Your Credits</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {openMarkets.length}
                </p>
                <p className="text-xs text-gray-500">Open Markets</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCredits(
                    DEMO_MARKETS.reduce((acc, m) => acc + m.totalVolume, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500">Total Volume</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {DEMO_LEADERBOARD.reduce((acc, l) => acc + l.totalBets, 0)}
                </p>
                <p className="text-xs text-gray-500">Total Bets</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Markets List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search markets by school or profile ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Open Markets */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Open Markets
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {openMarkets.map((market, index) => (
                  <motion.div
                    key={market.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <MarketCard
                      market={market}
                      profile={DEMO_PROFILES[market.applicantProfileId]}
                      onBet={(prediction) => handleBetClick(market, prediction)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Resolved Markets */}
            {resolvedMarkets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recently Resolved
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resolvedMarkets.map((market, index) => (
                    <motion.div
                      key={market.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <MarketCard
                        market={market}
                        profile={DEMO_PROFILES[market.applicantProfileId]}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Leaderboard */}
            <Leaderboard topPredictors={DEMO_LEADERBOARD} userRank={42} />

            {/* How It Works */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary-500" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-600">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                    1
                  </span>
                  <p>Browse anonymous applicant profiles and their target schools</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                    2
                  </span>
                  <p>Bet YES (they'll get in) or NO (they won't) using Council Credits</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                    3
                  </span>
                  <p>Odds update in real-time based on betting activity</p>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-medium">
                    4
                  </span>
                  <p>Markets resolve after admission decisions - winners get payouts!</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Betting Modal */}
      <BettingModal
        isOpen={!!selectedMarket}
        onClose={() => {
          setSelectedMarket(null);
          setSelectedPrediction(null);
        }}
        market={selectedMarket}
        prediction={selectedPrediction}
        userCredits={userCredits}
        onPlaceBet={handlePlaceBet}
      />
    </div>
  );
}
