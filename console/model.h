#pragma once

#include "common.h"
#include "issues.h"

// Everything the bot needs to simulate lives in plain structs. Players are indexed 0 and 1.

struct StateInfo
{
    const char *Name;
    int Votes;
    int MaxFunds;
    int8_t Supported[PartySize];    // issues the state likes
    int8_t NotSupported[PartySize]; // issues the state dislikes
};

struct World
{
    StateInfo States[NumStates];
    uint32_t PartyMask[2] = {0, 0};
    int PartyIssue[2][PartySize] = {};
    uint16_t Usable[2][NumStates] = {}; // bit j: player can campaign on slot j (0-4 liked, 5-9 disliked issues)
    string PlayerName[2];
    string PartyName[2];
};

struct StateDyn
{
    int16_t Pct[2] = {0, 0};
    int8_t Mom[2] = {0, 0};
    int8_t Funds = 0;
    int8_t Leader = -1; // last player to lead the state outright
    int8_t Winner = -1; // set once a state is locked (100%) or the game is over
};

struct Sim
{
    StateDyn St[NumStates];
    int16_t Funds[2] = {3, 3};
    int8_t Turn = 0; // completed turns
    int8_t Step = 0; // 0-1 poll, 2-3 public campaign, 4-5 advertisement, (end of turn), 6-7 funding
};

enum Kind : int8_t
{
    Pass,
    Poll,
    Public,
    Advert,
    TakeFunds
};

struct Move
{
    Kind K;
    int8_t State;
    int8_t Slot; // issue slot for campaigns (0-4 liked, 5-9 disliked); the bot's search ignores it

    Move(Kind K = Pass, int State = -1, int Slot = -1) : K(K), State(static_cast<int8_t>(State)), Slot(static_cast<int8_t>(Slot)) {}
};

inline bool terminal(const Sim &S) { return S.Turn >= TotalTurns; }
inline int moverOf(const Sim &S) { return S.Step & 1; }
inline Kind kindOfStep(int Step)
{
    static const Kind Phases[4] = {Poll, Public, Advert, TakeFunds};
    return Phases[Step / 2];
}

inline int issueOfSlot(const StateInfo &Si, int Slot)
{
    return Slot < PartySize ? Si.Supported[Slot] : Si.NotSupported[Slot - PartySize];
}

inline const Qnos &questionOfSlot(const StateInfo &Si, int Slot)
{
    const Issues &I = IssuesArray[issueOfSlot(Si, Slot)];
    return Slot < PartySize ? I.Supported : I.NotSupported;
}

// Each state likes 5 random issues and dislikes 5 others.
void assignStateIssues(World &W);

// A player may talk about a liked issue of the state that their party holds, or a disliked issue
// of the state that the opponent's party holds.
void computeUsable(World &W);

// Pick a random usable slot (the issue is irrelevant to the outcome, only the quiz differs).
int randomUsableSlot(const World &W, int p, int s);

// Winner of the exchange gains `Gain` momentum (max 3), the loser loses as much (min 0).
inline void boost(StateDyn &D, int Winner, int Gain)
{
    D.Mom[Winner] = static_cast<int8_t>(min(3, D.Mom[Winner] + Gain));
    D.Mom[1 - Winner] = static_cast<int8_t>(max(0, D.Mom[1 - Winner] - Gain));
}

// Legal moves for the player to move. `Prune` drops moves that are pointless for the bot to consider.
int genMoves(const World &W, const Sim &S, Move *Out, bool Prune);

void applyMove(Sim &S, int p, const Move &M, bool Correct, int PollRoll);

void endTurn(const World &W, Sim &S);

inline void advanceStep(const World &W, Sim &S)
{
    S.Step++;

    if (S.Step == 6)
    {
        endTurn(W, S);
        S.Turn++;
    }
    else if (S.Step == StepsPerTurn)
    {
        S.Step = 0;
    }
}

// Last turn: every state that is still open goes to whoever has more momentum (coin flip on a tie).
void finalizeGame(Sim &S);

// Electoral votes held by player p (states not yet decided count for their current leader).
int tally(const World &W, const Sim &S, int p);
