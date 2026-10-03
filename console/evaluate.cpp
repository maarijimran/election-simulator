#include "evaluate.h"

constexpr double SoftMomentum = 0.12; // win probability per point of momentum lead, early in the game
constexpr double SoftPercent = 0.30;  // win probability bonus for a big percentage lead
constexpr double FundValue = 4.0;     // worth of one spendable fund, in electoral votes
constexpr double ClaimValue = 1.5;    // worth of leading a state that is holding a fund
constexpr double SpecialValue = 2.5;  // worth of one unused special action while enough turns remain to play it

double stateTerm(const StateInfo &Si, const StateDyn &D, int TurnsLeft)
{
    const double Votes = Si.Votes;

    if (D.Winner >= 0)
    {
        return D.Winner == 0 ? Votes : -Votes;
    }

    const int MomDiff = D.Mom[0] - D.Mom[1];
    const double ByMomentum = MomDiff > 0 ? 1.0 : (MomDiff < 0 ? 0.0 : 0.5);
    const double Final = D.Pct[0] != D.Pct[1] ? (D.Pct[0] > D.Pct[1] ? 1.0 : 0.0) : ByMomentum; // how finalizeGame would decide it

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

static double specialWeight(int TurnsLeft) { return SpecialValue * min(1.0, TurnsLeft / 5.0); }

static int usesLeft(const Sim &S, int p)
{
    int Total = 0;

    for (int k = 0; k < SpecialKinds; k++)
    {
        Total += S.SpecialLeft[p][k];
    }

    return Total;
}

double marginOf(const World &W, const Sim &S)
{
    const int TurnsLeft = TotalTurns - S.Turn;
    double Total = fundsTerm(S.Funds[0], S.Funds[1], TurnsLeft) + specialWeight(TurnsLeft) * (usesLeft(S, 0) - usesLeft(S, 1));

    for (int s = 0; s < NumStates; s++)
    {
        Total += stateTerm(W.States[s], S.St[s], TurnsLeft);
    }

    return Total;
}

double moveGain(const World &W, const Sim &S, int p, const Move &M, double PChance)
{
    if (M.K == Pass)
    {
        return 0;
    }

    const int TurnsLeft = TotalTurns - S.Turn;
    int Funds[2] = {S.Funds[0], S.Funds[1]};
    double Before = 0, After = 0;
    int Used = 0;

    if (M.State >= 0)
    {
        const StateInfo &Si = W.States[M.State];
        const StateDyn &D = S.St[M.State];
        StateDyn Good = D, Bad = D;
        Before = stateTerm(Si, D, TurnsLeft);
        After = Before;

        switch (M.K)
        {
        case Poll:
            Good.Pct[0] = Good.Pct[1] = 50;
            After = stateTerm(Si, Good, TurnsLeft);
            Funds[p]--;
            break;
        case TakeFunds:
            Good.Funds = 0;
            After = stateTerm(Si, Good, TurnsLeft);
            Funds[p] += D.Funds;
            break;
        case Public:
        case Advert:
            boost(Good, p, gainOf(M.K));
            boost(Bad, 1 - p, gainOf(M.K));
            After = PChance * stateTerm(Si, Good, TurnsLeft) + (1 - PChance) * stateTerm(Si, Bad, TurnsLeft);
            Funds[p]--;
            break;
        case Celebrity:
            boost(Good, p, gainOf(Celebrity));
            After = stateTerm(Si, Good, TurnsLeft);
            Funds[p] -= specialCost(Celebrity);
            Used = 1;
            break;
        default:
            drain(Good, 1 - p);
            drain(Bad, p);
            After = ScandalChance * stateTerm(Si, Good, TurnsLeft) + (1 - ScandalChance) * stateTerm(Si, Bad, TurnsLeft);
            Funds[p] -= specialCost(Scandal);
            Used = 1;
        }
    }
    else
    {
        Funds[p] += FundraiserGain;
        Used = 1;
    }

    const double Delta = After - Before + fundsTerm(Funds[0], Funds[1], TurnsLeft) - fundsTerm(S.Funds[0], S.Funds[1], TurnsLeft) - (p == 0 ? Used : -Used) * specialWeight(TurnsLeft);
    return p == 0 ? Delta : -Delta;
}
