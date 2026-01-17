import { Router, Request, Response } from 'express';

export const marketsRouter = Router();

// In-memory storage for demo (replace with Supabase in production)
const markets: any[] = [];
const bets: any[] = [];

// Get all markets
marketsRouter.get('/', (req: Request, res: Response) => {
  res.json(markets);
});

// Get single market
marketsRouter.get('/:id', (req: Request, res: Response) => {
  const market = markets.find(m => m.id === req.params.id);
  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }
  res.json(market);
});

// Create market
marketsRouter.post('/', (req: Request, res: Response) => {
  const { applicantProfileId, schoolName, decisionType, decisionDate, initialOdds } = req.body;

  const market = {
    id: `market-${Date.now()}`,
    applicantProfileId,
    schoolName,
    decisionType,
    decisionDate,
    currentOddsYes: initialOdds || 50,
    currentOddsNo: 100 - (initialOdds || 50),
    totalVolume: 0,
    uniqueParticipants: 0,
    status: 'open',
    actualResult: null,
    resolvedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  markets.push(market);
  res.status(201).json(market);
});

// Place bet
marketsRouter.post('/:id/bet', (req: Request, res: Response) => {
  const { userId, prediction, amount } = req.body;
  const market = markets.find(m => m.id === req.params.id);

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  if (market.status !== 'open') {
    return res.status(400).json({ error: 'Market is not open for betting' });
  }

  const bet = {
    id: `bet-${Date.now()}`,
    marketId: market.id,
    userId,
    prediction,
    amount,
    oddsAtBet: prediction === 'yes' ? market.currentOddsYes : market.currentOddsNo,
    payout: 0,
    createdAt: new Date().toISOString(),
  };

  // Update market odds
  const weight = amount / (market.totalVolume + amount);
  const shift = weight * 10;

  if (prediction === 'yes') {
    market.currentOddsYes = Math.min(95, market.currentOddsYes + shift);
    market.currentOddsNo = Math.max(5, market.currentOddsNo - shift);
  } else {
    market.currentOddsYes = Math.max(5, market.currentOddsYes - shift);
    market.currentOddsNo = Math.min(95, market.currentOddsNo + shift);
  }

  market.totalVolume += amount;
  market.updatedAt = new Date().toISOString();

  bets.push(bet);
  res.status(201).json({ bet, market });
});

// Resolve market
marketsRouter.put('/:id/resolve', (req: Request, res: Response) => {
  const { result } = req.body;
  const market = markets.find(m => m.id === req.params.id);

  if (!market) {
    return res.status(404).json({ error: 'Market not found' });
  }

  market.status = 'resolved';
  market.actualResult = result;
  market.resolvedAt = new Date().toISOString();

  // Calculate payouts
  const marketBets = bets.filter(b => b.marketId === market.id);
  marketBets.forEach(bet => {
    const won = (result === 'accepted' && bet.prediction === 'yes') ||
                (result === 'rejected' && bet.prediction === 'no');
    if (won) {
      bet.payout = Math.floor(bet.amount * (100 / bet.oddsAtBet));
    }
  });

  res.json({ market, bets: marketBets });
});

// Get market activity
marketsRouter.get('/:id/activity', (req: Request, res: Response) => {
  const marketBets = bets
    .filter(b => b.marketId === req.params.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  res.json(marketBets);
});

// Get trending markets
marketsRouter.get('/trending', (req: Request, res: Response) => {
  const trending = markets
    .filter(m => m.status === 'open')
    .sort((a, b) => b.totalVolume - a.totalVolume)
    .slice(0, 10);

  res.json(trending);
});

// Get user's bets
marketsRouter.get('/user/:userId/bets', (req: Request, res: Response) => {
  const userBets = bets.filter(b => b.userId === req.params.userId);
  res.json(userBets);
});
