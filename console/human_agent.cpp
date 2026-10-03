#include "human_agent.h"
#include "console_io.h"
#include "issues.h"

void HumanAgent::pickParty(World &W, int p)
{
    for (int i = 0; i < NumIssues; i++)
    {
        cout << i + 1 << ". " << IssuesArray[i].Name << endl;
    }

    int Count = 0;

    while (Count != PartySize)
    {
        rule();
        const int Pick = readInt("Select 5 Issues for your Political Party to Support : ", 1, NumIssues) - 1;
        rule();

        if (((W.PartyMask[0] | W.PartyMask[1]) >> Pick) & 1)
        {
            cout << "Issue : " << IssuesArray[Pick].Name << " is already taken." << endl;
            rule();
        }
        else
        {
            W.PartyMask[p] |= 1u << Pick;
            W.PartyIssue[p][Count++] = Pick;
        }
    }
}

Move HumanAgent::chooseMove(const World &W, const Sim &S, int p, const AnswerStats &)
{
    const Kind K = kindOfStep(S.Step);
    Move Legal[MaxMoves];

    if (genMoves(W, S, Legal, false) == 1)
    {
        cout << W.PlayerName[p] << " has no available action in this phase." << endl;
        return Move();
    }

    for (;;)
    {
        cout << W.PlayerName[p] << " (Player " << playerWord(p) << ") Turn" << endl;
        const int Pick = readInt(promptFor(K), 0, NumStates) - 1;

        if (Pick < 0)
        {
            return Move();
        }

        const string Why = whyNot(W, S, p, K, Pick);

        if (!Why.empty())
        {
            cout << Why << endl;
            continue;
        }

        if (K == Public || K == Advert)
        {
            const int Slot = askIssue(W, p, Pick);

            if (Slot < 0)
            {
                continue;
            }

            return Move(K, Pick, Slot);
        }

        return Move(K, Pick);
    }
}

bool HumanAgent::answer(const string &Issue, const Qnos &Q)
{
    cout << "Question Related Issue : " << Issue << endl;
    cout << Q.Question << endl;
    cout << "Answers" << endl;

    for (int k = 0; k < 3; k++)
    {
        cout << Q.Answers[k].Num << ") " << Q.Answers[k].Answer << endl;
    }

    const int Choice = readInt("Select Correct Answer : ", 1, 3);

    for (int k = 0; k < 3; k++)
    {
        if (Q.Answers[k].Num == Choice)
        {
            return Q.Answers[k].IsTrue;
        }
    }

    return false;
}

const char *HumanAgent::promptFor(Kind K)
{
    switch (K)
    {
    case Poll:
        return "Select State to hold Polling or Enter 0 to end turn : ";
    case Public:
        return "Select State to hold a Campaign or Enter 0 to end turn : ";
    case Advert:
        return "Select State for an Advertisement Campaign or Enter 0 to end turn : ";
    default:
        return "Select State to Get Funds or Enter 0 to end turn : ";
    }
}

string HumanAgent::whyNot(const World &W, const Sim &S, int p, Kind K, int s)
{
    const StateDyn &D = S.St[s];
    const string Name = W.States[s].Name;

    if (D.Winner >= 0)
    {
        return Name + " has been Already won by " + W.PlayerName[D.Winner];
    }

    if (K == TakeFunds)
    {
        if (D.Pct[p] <= D.Pct[1 - p])
        {
            ostringstream Msg;
            Msg << "You cannot take funds as your Winning Percentage is Low\nPlayer One : " << D.Pct[0] << " vs " << D.Pct[1] << " : Player Two";
            return Msg.str();
        }
        if (D.Funds <= 0)
        {
            return Name + " has no funds to take right now.";
        }
    }
    else if ((K == Public || K == Advert) && !W.Usable[p][s])
    {
        return "No issue of " + Name + " matches your party's issues (or the issues your opponent's party holds).";
    }

    return "";
}

int HumanAgent::askIssue(const World &W, int p, int s)
{
    const StateInfo &Si = W.States[s];
    rule();
    cout << "Issues Supported by State : " << Si.Name << endl;
    rule();

    for (int j = 0; j < PartySize; j++)
    {
        cout << j + 1 << ") " << IssuesArray[Si.Supported[j]].Name << (((W.Usable[p][s] >> j) & 1) ? "   <- your party supports this" : "") << endl;
    }

    rule();
    cout << "Issues Not Supported by State : " << Si.Name << endl;
    rule();

    for (int j = 0; j < PartySize; j++)
    {
        cout << j + 6 << ") " << IssuesArray[Si.NotSupported[j]].Name << (((W.Usable[p][s] >> (PartySize + j)) & 1) ? "   <- your opponent's party holds this" : "") << endl;
    }

    rule();

    for (;;)
    {
        const int Pick = readInt("Enter Issue Number To Talk About (0 to choose another state) : ", 0, 2 * PartySize);

        if (Pick == 0)
        {
            return -1;
        }
        if ((W.Usable[p][s] >> (Pick - 1)) & 1)
        {
            return Pick - 1;
        }

        cout << (Pick <= PartySize ? "Your party does not support that issue." : "Your opponent's party does not hold that issue.") << endl;
    }
}
