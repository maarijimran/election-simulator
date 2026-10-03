#include "model.h"
#include "states.h"

void assignStateIssues(World &W)
{
    vector<int> Ids(NumIssues);
    for (int i = 0; i < NumIssues; i++)
    {
        Ids[i] = i;
    }

    for (int s = 0; s < NumStates; s++)
    {
        shuffle(Ids.begin(), Ids.end(), Rng);
        W.States[s].Name = StateSeeds[s].Name;
        W.States[s].Votes = StateSeeds[s].Votes;
        W.States[s].MaxFunds = StateSeeds[s].MaxFunds;

        for (int j = 0; j < PartySize; j++)
        {
            W.States[s].Supported[j] = static_cast<int8_t>(Ids[j]);
            W.States[s].NotSupported[j] = static_cast<int8_t>(Ids[PartySize + j]);
        }
    }
}

void computeUsable(World &W)
{
    for (int p = 0; p < 2; p++)
    {
        for (int s = 0; s < NumStates; s++)
        {
            uint16_t Mask = 0;

            for (int j = 0; j < PartySize; j++)
            {
                if ((W.PartyMask[p] >> W.States[s].Supported[j]) & 1)
                {
                    Mask |= 1 << j;
                }
                if ((W.PartyMask[1 - p] >> W.States[s].NotSupported[j]) & 1)
                {
                    Mask |= 1 << (PartySize + j);
                }
            }

            W.Usable[p][s] = Mask;
        }
    }
}

int randomUsableSlot(const World &W, int p, int s)
{
    int Slots[2 * PartySize];
    int Count = 0;

    for (int j = 0; j < 2 * PartySize; j++)
    {
        if ((W.Usable[p][s] >> j) & 1)
        {
            Slots[Count++] = j;
        }
    }

    return Count ? Slots[Rng() % Count] : -1;
}

int genMoves(const World &W, const Sim &S, Move *Out, bool Prune)
{
    const int p = moverOf(S);
    const Kind K = kindOfStep(S.Step);
    int n = 0;
    Out[n++] = Move();

    if (K != TakeFunds && S.Funds[p] <= 0)
    {
        return n;
    }

    for (int s = 0; s < NumStates; s++)
    {
        const StateDyn &D = S.St[s];

        if (D.Winner >= 0)
        {
            continue;
        }

        if (K == Poll)
        {
            if (Prune && D.Pct[0] == 50 && D.Pct[1] == 50)
            {
                continue;
            }
        }
        else if (K == TakeFunds)
        {
            if (D.Funds <= 0 || D.Pct[p] <= D.Pct[1 - p])
            {
                continue;
            }
        }
        else if (!W.Usable[p][s])
        {
            continue;
        }

        Out[n++] = Move(K, s);
    }

    return n;
}

void applyMove(Sim &S, int p, const Move &M, bool Correct, int PollRoll)
{
    switch (M.K)
    {
    case Poll:
        S.Funds[p]--;
        S.St[M.State].Pct[0] = static_cast<int16_t>(PollRoll);
        S.St[M.State].Pct[1] = static_cast<int16_t>(100 - PollRoll);
        break;
    case Public:
    case Advert:
        S.Funds[p]--;
        boost(S.St[M.State], Correct ? p : 1 - p, M.K == Public ? 2 : 1);
        break;
    case TakeFunds:
        S.Funds[p] += S.St[M.State].Funds;
        S.St[M.State].Funds = 0;
        break;
    case Pass:
        break;
    }
}

void endTurn(const World &W, Sim &S)
{
    for (int s = 0; s < NumStates; s++)
    {
        StateDyn &D = S.St[s];

        if (D.Winner >= 0)
        {
            continue;
        }

        if (D.Funds < W.States[s].MaxFunds)
        {
            D.Funds++;
        }

        if (D.Mom[0] > D.Mom[1])
        {
            D.Pct[0] += 5;
            D.Pct[1] -= 5;
        }
        else if (D.Mom[1] > D.Mom[0])
        {
            D.Pct[0] -= 5;
            D.Pct[1] += 5;
        }

        if (D.Pct[0] > D.Pct[1])
        {
            D.Leader = 0;
        }
        else if (D.Pct[1] > D.Pct[0])
        {
            D.Leader = 1;
        }

        if (D.Pct[0] >= 100)
        {
            D.Winner = 0;
        }
        else if (D.Pct[1] >= 100)
        {
            D.Winner = 1;
        }
    }
}

void finalizeGame(Sim &S)
{
    for (int s = 0; s < NumStates; s++)
    {
        StateDyn &D = S.St[s];

        if (D.Winner < 0)
        {
            D.Winner = D.Mom[0] > D.Mom[1] ? 0 : (D.Mom[1] > D.Mom[0] ? 1 : static_cast<int>(Rng() & 1));
            D.Pct[D.Winner] = 100;
            D.Pct[1 - D.Winner] = 0;
        }
    }
}

int tally(const World &W, const Sim &S, int p)
{
    int Total = 0;

    for (int s = 0; s < NumStates; s++)
    {
        const StateDyn &D = S.St[s];

        if (D.Winner == p || (D.Winner < 0 && D.Leader == p))
        {
            Total += W.States[s].Votes;
        }
    }

    return Total;
}
