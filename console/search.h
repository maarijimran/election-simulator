#pragma once

#include "model.h"

// Bot search: expectiminimax with alpha-beta, iterative deepening and a time budget.
//   * max nodes for the bot, min nodes for the opponent (assumed to play well),
//   * chance nodes for campaign answers (bot: its own accuracy, opponent: the learned estimate),
//   * polls are searched as their expected outcome (a 50/50 split),
//   * moves are ordered by moveGain() and only the best few are searched below the root (beam),
//   * forced moves (only "pass" available) do not consume depth.
// Values are in [-ValueBound, ValueBound] from the bot's point of view (a squashed margin).

typedef chrono::steady_clock Clock;

struct SearchResult
{
    Move Best;
    int Depth = 0;
    long Nodes = 0;
    double Value = 0;
    double Ms = 0;
};

struct ScoredMove
{
    double Score;
    Move M;
};

class Searcher
{
public:
    Searcher(const World &W, int Me, double PMe, double POpp) : W(W), Me(Me), PMe(PMe), POpp(POpp) {}

    SearchResult think(const Sim &S, int MaxDepth, int TimeMs);

    // Moves for the player to move, best-looking first.
    int rank(const Sim &S, ScoredMove *List) const;

private:
    const World &W;
    const int Me;
    const double PMe, POpp;
    Clock::time_point Deadline;
    long Nodes = 0;
    bool Aborted = false;
    bool CutByDepth = false;

    static int beamWidth(int Ply) { return Ply == 0 ? MaxMoves : (Ply == 1 ? 10 : (Ply == 2 ? 7 : 5)); }

    double leaf(const Sim &S) const;

    double child(const Sim &S, int p, const Move &M, bool Correct, int Depth, int Ply, double Alpha, double Beta);

    // Value of making move M: a plain child for deterministic moves, a chance node (quiz answer) for campaigns.
    // The chance node uses Star1 pruning: the window passed to each outcome assumes the others are as good or as
    // bad as the value bounds allow.
    double valueMove(const Sim &S, int p, const Move &M, int Depth, int Ply, double Alpha, double Beta);

    double search(const Sim &S, int Depth, int Ply, double Alpha, double Beta);
};
