#include "evaluate.h"

constexpr double SoftMomentum = 0.12; // win probability per point of momentum lead, early in the game
constexpr double SoftPercent = 0.20;  // win probability bonus for a big percentage lead
constexpr double FundValue = 4.0;     // worth of one spendable fund, in electoral votes
constexpr double ClaimValue = 1.5;    // worth of leading a state that is holding a fund

double stateTerm(const StateInfo &Si, const StateDyn &D, int TurnsLeft)
{
    const double Votes = Si.Votes;

    if (D.Winner >= 0)
    {
        return D.Winner == 0 ? Votes : -Votes;
    }

    const int MomDiff = D.Mom[0] - D.Mom[1];
    const double Final = MomDiff > 0 ? 1.0 : (MomDiff < 0 ? 0.0 : 0.5); // how finalizeGame would decide it

    if (TurnsLeft <= 0)
    {
        return Votes * (2 * Final - 1);
    }

    const double Soft = clampd(0.5 + SoftMomentum * MomDiff + SoftPercent * clampd((D.Pct[0] - D.Pct[1]) / 60.0, -1, 1), 0.03, 0.97);
    const double Elapsed = 1.0 - static_cast<double>(TurnsLeft) / TotalTurns;
    const double Weight = Elapsed * Elapsed; // the closer to the end, the more the exact rule matters
    const double P = Weight * Final + (1 - Weight) * Soft;
    const int Claim = (D.Pct[0] > D.Pct[1]) - (D.Pct[1] > D.Pct[0]);

    return Votes * (2 * P - 1) + ClaimValue * D.Funds * Claim;
}

double fundsTerm(int Funds0, int Funds1, int TurnsLeft)
{
    const int Cap = 3 * TurnsLeft; // at most three paid actions per turn
    return FundValue * (min(Funds0, Cap) - min(Funds1, Cap));
}

double marginOf(const World &W, const Sim &S)
{
    const int TurnsLeft = TotalTurns - S.Turn;
    double Total = fundsTerm(S.Funds[0], S.Funds[1], TurnsLeft);

    for (int s = 0; s < NumStates; s++)
    {
        Total += stateTerm(W.States[s], S.St[s], TurnsLeft);
    }

    return Total;
}

double moveGain(const World &W, const Sim &S, int p, const Move &M, double PCorrect)
{
    if (M.K == Pass)
    {
        return 0;
    }

    const int TurnsLeft = TotalTurns - S.Turn;
    const StateInfo &Si = W.States[M.State];
    const StateDyn &D = S.St[M.State];
    int Funds[2] = {S.Funds[0], S.Funds[1]};
    double After;

    if (M.K == Poll)
    {
        StateDyn N = D;
        N.Pct[0] = N.Pct[1] = 50;
        After = stateTerm(Si, N, TurnsLeft);
        Funds[p]--;
    }
    else if (M.K == TakeFunds)
    {
        StateDyn N = D;
        N.Funds = 0;
        After = stateTerm(Si, N, TurnsLeft);
        Funds[p] += D.Funds;
    }
    else
    {
        const int Gain = M.K == Public ? 2 : 1;
        StateDyn Good = D, Bad = D;
        boost(Good, p, Gain);
        boost(Bad, 1 - p, Gain);
        After = PCorrect * stateTerm(Si, Good, TurnsLeft) + (1 - PCorrect) * stateTerm(Si, Bad, TurnsLeft);
        Funds[p]--;
    }

    const double Delta = After - stateTerm(Si, D, TurnsLeft) + fundsTerm(Funds[0], Funds[1], TurnsLeft) - fundsTerm(S.Funds[0], S.Funds[1], TurnsLeft);
    return p == 0 ? Delta : -Delta;
}
