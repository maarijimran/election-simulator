#include "search.h"
#include "evaluate.h"

constexpr double ValueBound = 1000.0;
static const double Inf = numeric_limits<double>::infinity();

SearchResult Searcher::think(const Sim &S, int MaxDepth, int TimeMs)
{
    SearchResult R;
    ScoredMove List[MaxMoves];
    int n = rank(S, List);
    n = min(n, beamWidth(0));
    const int p = moverOf(S);
    const Clock::time_point Start = Clock::now();

    R.Best = List[0].M;
    Deadline = Start + chrono::milliseconds(TimeMs);
    Nodes = 0;
    Aborted = false;

    for (int Depth = 1; n > 1 && Depth <= MaxDepth; Depth++)
    {
        CutByDepth = false;
        double Alpha = -Inf, BestValue = -Inf;
        int BestIndex = 0;

        for (int i = 0; i < n; i++)
        {
            const double V = valueMove(S, p, List[i].M, Depth - 1, 0, Alpha, Inf);

            if (Aborted)
            {
                break;
            }
            if (V > BestValue)
            {
                BestValue = V;
                BestIndex = i;
                Alpha = max(Alpha, V);
            }
        }

        if (Aborted)
        {
            break;
        }

        R.Best = List[BestIndex].M;
        R.Depth = Depth;
        R.Value = BestValue;

        // Searched best move first next time: it tightens the window for everything after it.
        const ScoredMove Pv = List[BestIndex];
        for (int i = BestIndex; i > 0; i--)
        {
            List[i] = List[i - 1];
        }
        List[0] = Pv;

        if (!CutByDepth)
        {
            break; // the whole game tree fit inside this depth
        }
    }

    R.Nodes = Nodes;
    R.Ms = chrono::duration<double, milli>(Clock::now() - Start).count();
    return R;
}

int Searcher::rank(const Sim &S, ScoredMove *List) const
{
    Move Moves[MaxMoves];
    const int n = genMoves(W, S, Moves, true);
    const int p = moverOf(S);
    const double PCorrect = p == Me ? PMe : POpp;

    for (int i = 0; i < n; i++)
    {
        List[i].Score = moveGain(W, S, p, Moves[i], PCorrect);
        List[i].M = Moves[i];
    }

    sort(List, List + n, [](const ScoredMove &A, const ScoredMove &B)
         { return A.Score > B.Score; });
    return n;
}

double Searcher::leaf(const Sim &S) const
{
    const int TurnsLeft = TotalTurns - S.Turn;
    const double V = ValueBound * tanh(marginOf(W, S) / (12.0 + 5.0 * TurnsLeft));
    return Me == 0 ? V : -V;
}

double Searcher::child(const Sim &S, int p, const Move &M, bool Correct, int Depth, int Ply, double Alpha, double Beta)
{
    Sim C = S;
    applyMove(C, p, M, Correct, 50);
    advanceStep(W, C);
    return search(C, Depth, Ply + 1, Alpha, Beta);
}

double Searcher::valueMove(const Sim &S, int p, const Move &M, int Depth, int Ply, double Alpha, double Beta)
{
    const double W0 = chanceOf(M.K, p == Me ? PMe : POpp);

    if (W0 < 0)
    {
        return child(S, p, M, true, Depth, Ply, Alpha, Beta);
    }

    const double W1 = 1 - W0;
    const double A0 = (Alpha - W1 * ValueBound) / W0, B0 = (Beta + W1 * ValueBound) / W0;
    const double V0 = child(S, p, M, true, Depth, Ply, max(A0, -ValueBound), min(B0, ValueBound));

    if (Aborted)
    {
        return 0;
    }
    if (V0 <= A0)
    {
        return W0 * V0 + W1 * ValueBound; // whatever the other outcome is, we cannot beat alpha
    }
    if (V0 >= B0)
    {
        return W0 * V0 - W1 * ValueBound; // whatever the other outcome is, beta is already exceeded
    }

    const double A1 = (Alpha - W0 * V0) / W1, B1 = (Beta - W0 * V0) / W1;
    const double V1 = child(S, p, M, false, Depth, Ply, max(A1, -ValueBound), min(B1, ValueBound));
    return W0 * V0 + W1 * V1;
}

double Searcher::search(const Sim &S, int Depth, int Ply, double Alpha, double Beta)
{
    if (terminal(S))
    {
        return leaf(S);
    }
    if (Depth <= 0)
    {
        CutByDepth = true;
        return leaf(S);
    }
    if ((++Nodes & 1023) == 0 && Clock::now() >= Deadline)
    {
        Aborted = true;
    }
    if (Aborted)
    {
        return 0;
    }

    ScoredMove List[MaxMoves];
    int n = rank(S, List);
    const int p = moverOf(S);
    const bool Maximizing = p == Me;
    const int ChildDepth = n == 1 ? Depth : Depth - 1; // forced move: free
    double Best = Maximizing ? -Inf : Inf;
    n = min(n, beamWidth(Ply));

    for (int i = 0; i < n; i++)
    {
        const double V = valueMove(S, p, List[i].M, ChildDepth, Ply, Alpha, Beta);

        if (Aborted)
        {
            return 0;
        }

        if (Maximizing)
        {
            Best = max(Best, V);
            Alpha = max(Alpha, Best);
        }
        else
        {
            Best = min(Best, V);
            Beta = min(Beta, Best);
        }

        if (Alpha >= Beta)
        {
            break;
        }
    }

    return Best;
}
