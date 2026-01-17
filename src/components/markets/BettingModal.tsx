import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Info, Calculator } from 'lucide-react';
import { Modal, Button, Input, Badge } from '../ui';
import { formatCredits, cn } from '../../lib/utils';
import type { AdmissionsMarket } from '../../types';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  market: AdmissionsMarket | null;
  prediction: 'yes' | 'no' | null;
  userCredits: number;
  onPlaceBet: (amount: number) => void;
}

export function BettingModal({
  isOpen,
  onClose,
  market,
  prediction,
  userCredits,
  onPlaceBet,
}: BettingModalProps) {
  const [amount, setAmount] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!market || !prediction) return null;

  const betAmount = parseInt(amount) || 0;
  const odds = prediction === 'yes' ? market.currentOddsYes : market.currentOddsNo;
  const potentialPayout = Math.floor(betAmount * (100 / odds));
  const potentialProfit = potentialPayout - betAmount;

  const handleSubmit = async () => {
    if (betAmount <= 0 || betAmount > userCredits) return;

    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Simulate API call
    onPlaceBet(betAmount);
    setIsSubmitting(false);
    onClose();
  };

  const quickAmounts = [50, 100, 250, 500];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Place Bet" size="md">
      <div className="space-y-6">
        {/* Market Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Market</span>
            <span className="font-medium">
              #{market.applicantProfileId} → {market.schoolName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Your Prediction</span>
            <Badge
              variant={prediction === 'yes' ? 'success' : 'danger'}
              className="flex items-center gap-1"
            >
              {prediction === 'yes' ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {prediction.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Current Odds */}
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">Current Odds</p>
            <p
              className={cn(
                'text-2xl font-bold',
                prediction === 'yes' ? 'text-green-600' : 'text-red-600'
              )}
            >
              {odds}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">If you win</p>
            <p className="text-2xl font-bold text-gray-900">
              {((100 / odds) * 100 - 100).toFixed(0)}% return
            </p>
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bet Amount (Council Credits)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            max={userCredits}
            className="text-lg font-semibold"
          />
          <p className="text-sm text-gray-500 mt-1">
            Available: {formatCredits(userCredits)} CC
          </p>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2 mt-3">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                variant={parseInt(amount) === quickAmount ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={quickAmount > userCredits}
              >
                {quickAmount}
              </Button>
            ))}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAmount(userCredits.toString())}
            >
              Max
            </Button>
          </div>
        </div>

        {/* Payout Calculator */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">
              Potential Outcome
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">If you win</p>
              <p className="text-xl font-bold text-green-600">
                +{formatCredits(potentialProfit)} CC
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total payout</p>
              <p className="text-xl font-bold text-gray-900">
                {formatCredits(potentialPayout)} CC
              </p>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 text-sm text-gray-500">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Bets are final and cannot be cancelled. Payouts are distributed when
            the market resolves after the admission decision is announced.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={betAmount <= 0 || betAmount > userCredits}
            isLoading={isSubmitting}
            className={cn(
              'flex-1',
              prediction === 'yes'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            )}
          >
            Place {prediction.toUpperCase()} Bet
          </Button>
        </div>
      </div>
    </Modal>
  );
}
