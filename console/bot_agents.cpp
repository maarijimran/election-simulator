#include "bot_agents.h"
#include "console_io.h"

void BotAgent::pickParty(World &W, int p)
{
    vector<int> Ids(NumIssues);

    for (int i = 0; i < NumIssues; i++)
    {
        Ids[i] = i;
    }

    shuffle(Ids.begin(), Ids.end(), Rng);
    int Count = 0;

    for (int i = 0; i < NumIssues && Count < PartySize; i++)
    {
        if (!((W.PartyMask[1 - p] >> Ids[i]) & 1))
        {
            W.PartyMask[p] |= 1u << Ids[i];
            W.PartyIssue[p][Count++] = Ids[i];
        }
    }
}

bool BotAgent::answer(const string &, const Qnos &)
{
    return uniform_real_distribution<double>(0, 1)(Rng) < Accuracy;
}

Move BotAgent::withSlot(const World &W, int p, Move M)
{
    if (M.K == Public || M.K == Advert)
    {
        M.Slot = static_cast<int8_t>(randomUsableSlot(W, p, M.State));
    }

    return M;
}

Move SearchAgent::chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent)
{
    Searcher Se(W, p, D.Accuracy, Opponent.estimate());
    const SearchResult R = Se.think(S, D.MaxDepth, D.Ms);
    Move M = R.Best;

    Decisions++;
    DepthSum += R.Depth;

    if (D.Blunder > 0 && uniform_real_distribution<double>(0, 1)(Rng) < D.Blunder)
    {
        ScoredMove List[MaxMoves];
        const int n = Se.rank(S, List);
        M = List[Rng() % min(n, 3)].M;
    }

    if (Verbose && R.Depth > 0)
    {
        cout << "  [bot searched " << R.Depth << " plies, " << R.Nodes << " nodes, " << fixed << setprecision(2) << R.Ms / 1000 << "s; outlook for it: " << setprecision(0) << 50 + R.Value / 20 << "%]" << endl;
    }

    return withSlot(W, p, M);
}

Move GreedyAgent::chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent)
{
    ScoredMove List[MaxMoves];
    Searcher(W, p, 0.7, Opponent.estimate()).rank(S, List);
    return withSlot(W, p, List[0].M);
}

Move RandomAgent::chooseMove(const World &W, const Sim &S, int p, const AnswerStats &)
{
    Move Moves[MaxMoves];
    const int n = genMoves(W, S, Moves, false);
    return withSlot(W, p, Moves[Rng() % n]);
}
