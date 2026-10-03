// Election Simulator
//
// Two players (human or bot) fight for the electoral votes of 50 states over 20 turns.
//
// The bot is an expectiminimax searcher: minimax over the two players' moves, expectation over the
// campaign quiz answers, alpha-beta pruning (Star1 bounds at chance nodes), iterative deepening under
// a time budget, heuristic move ordering with a beam, and an opponent model that learns how often
// the human answers questions correctly.
//
// Build:  g++ -std=c++14 -O2 Project.cpp -o Project.exe
// Extras: Project.exe --benchmark [games] [ms per move] [seed]   (bot vs random / greedy baselines)

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <random>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

constexpr int NumIssues = 20;
constexpr int NumStates = 50;
constexpr int PartySize = 5;
constexpr int TotalTurns = 20;
constexpr int StepsPerTurn = 8; // poll, public campaign, advertisement, funding: one step per player each
constexpr int MaxMoves = 64;    // pass + at most one move per state

static mt19937 Rng(static_cast<unsigned>(time(nullptr)));

struct Ans
{
    string Answer;
    bool IsTrue;
    int Num;
};

struct Qnos
{
    string Question;
    Ans Answers[3];
};

struct Issues
{
    string Name;
    Qnos Supported;
    Qnos NotSupported;

    Issues() {}

    Issues(string IssueName, string SPQuestion, string SPAns1, bool IsTrue1, int Num1, string SPAns2, bool IsTrue2, int Num2, string SPAns3, bool IsTrue3, int Num3, string NSPQuestion, string NSPAns1, bool NIsTrue1, int NNum1, string NSPAns2, bool NIsTrue2, int NNum2, string NSPAns3, bool NIsTrue3, int NNum3)
    {
        Name = IssueName;
        Supported.Question = SPQuestion;
        Supported.Answers[0] = {SPAns1, IsTrue1, Num1};
        Supported.Answers[1] = {SPAns2, IsTrue2, Num2};
        Supported.Answers[2] = {SPAns3, IsTrue3, Num3};

        NotSupported.Question = NSPQuestion;
        NotSupported.Answers[0] = {NSPAns1, NIsTrue1, NNum1};
        NotSupported.Answers[1] = {NSPAns2, NIsTrue2, NNum2};
        NotSupported.Answers[2] = {NSPAns3, NIsTrue3, NNum3};
    }
};

static const Issues IssuesArray[NumIssues] = {{Issues("Health Care", "What measures will you take to improve access to healthcare for all citizens?", "Implement universal healthcare.", false, 1, "Privatize healthcare services.", false, 2, "Increase funding for public healthcare programs.", true, 3, "How would you reduce government spending on healthcare?", "Decrease funding for public healthcare programs.", false, 1, "Privatize healthcare services.", false, 2, "Implement universal healthcare.", true, 3)}, {Issues("Education", "How will you improve the quality of public education in our state?", "Increase funding for public schools.", true, 1, "Implement standardized testing for teachers.", false, 2, "Provide vouchers for private schools.", false, 3, "What measures will you take to reduce government involvement in education?", "Privatize education.", false, 1, "Implement standardized testing for teachers.", false, 2, "Increase funding for public schools.", true, 3)}, {Issues("Climate Change", "What actions will you take to combat climate change?", "Invest in renewable energy sources.", true, 1, "Deregulate the fossil fuel industry.", false, 2, "Subsidize coal production.", false, 3, "How would you address the economic benefits of fossil fuel production?", "Deregulate the fossil fuel industry.", false, 1, "Invest in renewable energy sources.", false, 2, "Subsidize coal production.", true, 3)}, {Issues("Minimum Wage", "How will you address the issue of increasing the minimum wage?", " Implement a $100 minimum wage.", true, 1, "Abolish the minimum wage.", false, 2, "Allow individual states to set their minimum wage.", false, 3, "What measures will you take to prevent an increase in the minimum wage?", "Abolish the minimum wage.", false, 1, "Allow individual states to set their minimum wage.", true, 2, "Implement a $100 minimum wage.", false, 3)}, {Issues("Gun Control", "What measures will you take to implement responsible gun control laws?", "Enforce universal background checks.", true, 1, "Arm teachers in schools.", false, 2, "Repeal all gun control laws.", false, 3, "How would you ensure the protection of Second Amendment rights?", "Arm teachers in schools.", false, 1, "Repeal all gun control laws.", true, 2, "Enforce universal background checks.", false, 3)}, {Issues("Infrastructure", "What steps will you take to improve the state's infrastructure?", "Increase funding for repairing roads and bridges.", true, 1, "Privatize infrastructure maintenance.", false, 2, "Decrease funding for public transportation.", false, 3, "How would you reduce government spending on infrastructure?", "Privatize infrastructure maintenance.", false, 1, "Decrease funding for public transportation.", true, 2, "Increase funding for repairing roads and bridges.", false, 3)}, {Issues("Immigration", "How will you reform the immigration system to ensure fairness and security?", "Implement a pathway to citizenship for undocumented immigrants.", true, 1, "Build a wall along the entire border.", false, 2, "Increase deportations of undocumented immigrants.", false, 3, "What measures will you take to decrease immigration to the country?", "Build a wall along the entire border.", true, 1, "Increase deportations of undocumented immigrants.", false, 2, "Implement a pathway to citizenship for undocumented immigrants.", false, 3)}, {Issues("Taxation", "What changes will you make to the tax system to ensure fairness and adequacy?", "Implement a progressive tax system.", true, 1, "Cut taxes for the wealthy.", false, 2, "Increase taxes on the middle class.", false, 3, "How would you reduce taxes for the wealthy?", "Cut taxes for the wealthy.", false, 1, "Increase taxes on the middle class.", true, 2, "Implement a progressive tax system.", false, 3)}, {Issues("Gender Equality", "How will you promote gender equality and address gender discrimination?", "Enforce equal pay for equal work.", true, 1, "Limit women's access to certain jobs.", false, 2, "Abolish women's rights movements.", false, 3, "What measures will you take to roll back gender equality initiatives?", "Limit women's access to certain jobs.", true, 1, "Abolish women's rights movements.", false, 2, "Enforce equal pay for equal work.", false, 3)}, {Issues("Affordable Housing", "What measures will you take to ensure affordable housing for all citizens?", "Increase funding for low-income housing programs.", true, 1, "Deregulate the housing market.", false, 2, "Privatize public housing.", false, 3, "How would you address the shortage of affordable housing without government intervention?", "Deregulate the housing market.", false, 1, "Privatize public housing.", true, 2, "Increase funding for low-income housing programs.", false, 3)}, {Issues("Racial Justice", "What steps will you take to address racial injustice and promote equality?", "Implement police reform and accountability measures.", true, 1, "Increase funding for racially discriminatory institutions.", false, 2, "Abolish affirmative action programs.", false, 3, "How would you prevent the implementation of affirmative action programs?", "Increase funding for racially discriminatory institutions.", true, 1, "Abolish affirmative action programs.", false, 2, "Implement police reform and accountability measures.", false, 3)}, {Issues("National Security", "How will you ensure national security while protecting civil liberties?", "Strengthen intelligence and diplomatic efforts.", true, 1, "Increase domestic surveillance.", false, 2, "Implement martial law.", false, 3, "What measures will you take to increase domestic surveillance?", "Increase domestic surveillance.", true, 1, "Implement martial law.", false, 2, "Strengthen intelligence and diplomatic efforts.", false, 3)}, {Issues("Environmental Protection", "What steps will you take to protect the environment and prevent pollution?", "Enforce strict environmental regulations.", true, 1, "Roll back environmental protections.", false, 2, "Encourage industrial pollution.", false, 3, "How would you reduce government regulations on environmental protection?", "Roll back environmental protections.", true, 1, "Encourage industrial pollution.", false, 2, "Enforce strict environmental regulations.", false, 3)}, {Issues("Elderly Care", "How will you improve care for the elderly and support caregivers?", "Increase funding for Medicare and Medicaid. ", true, 1, "Privatize Medicare and Medicaid.", false, 2, "Cut funding for elderly care programs.", false, 3, "What measures will you take to cut funding for elderly care programs?", "Privatize Medicare and Medicaid.", true, 1, "Cut funding for elderly care programs.", false, 2, "Increase funding for Medicare and Medicaid.", false, 3)}, {Issues("Drug Policy", "How will you address the opioid epidemic and drug addiction?", "Increase funding for addiction treatment programs.", true, 1, "Implement stricter drug sentencing laws.", false, 2, "Legalize all drugs.", false, 3, "What measures will you take to maintain strict drug sentencing laws?", "Implement stricter drug sentencing laws.", true, 1, "Legalize all drugs.", false, 2, "Increase funding for addiction treatment programs.", false, 3)}, {Issues("Cybersecurity", "What steps will you take to enhance cybersecurity and protect against cyber threats?", "Invest in cybersecurity infrastructure and training.", true, 1, "Deregulate the internet to allow for more competition.", false, 2, "Decrease funding for cybersecurity programs.", false, 3, "How would you reduce government spending on cybersecurity?", "Deregulate the internet to allow for more competition.", false, 1, "Decrease funding for cybersecurity programs.", true, 2, "Invest in cybersecurity infrastructure and training.", false, 3)}, {Issues("Animal Rights", "What measures will you take to protect animal rights and prevent animal cruelty?", "Strengthen animal welfare laws and enforcement.", true, 1, "Deregulate animal welfare laws.", false, 2, "Promote animal testing for cosmetic products.", false, 3, "How would you deregulate animal welfare laws?", "Deregulate animal welfare laws.", true, 1, "Promote animal testing for cosmetic products.", false, 2, "Strengthen animal welfare laws and enforcement.", false, 3)}, {Issues("LGBTQ+ Rights", "How will you promote LGBTQ+ rights and protect against discrimination?", "Enforce anti-discrimination laws.", true, 1, "Roll back LGBTQ+ rights protections.", false, 2, "Promote conversion therapy.", false, 3, "What measures will you take to roll back LGBTQ+ rights protections?", "Roll back LGBTQ+ rights protections.", true, 1, "Promote conversion therapy.", false, 2, "Enforce anti-discrimination laws.", false, 3)}, {Issues("Privacy", "What steps will you take to protect citizens' privacy rights?", "Strengthen data protection regulations.", true, 1, "Increase government surveillance.", false, 2, "Allow companies to sell personal data without consent.", false, 3, "How would you increase government surveillance?", "Increase government surveillance.", true, 1, "Allow companies to sell personal data without consent.", false, 2, "Strengthen data protection regulations.", false, 3)}, {Issues("Foreign Policy", "What measures will you take to promote peace and cooperation in foreign relations?", "Prioritize diplomacy and international cooperation.", true, 1, "Increase military spending and intervention.", false, 2, "Implement protectionist trade policies.", false, 3, "How would you increase military spending and intervention?", "Increase military spending and intervention.", true, 1, "Implement protectionist trade policies.", false, 2, "Prioritize diplomacy and international cooperation.", false, 3)}};

struct StateSeed
{
    const char *Name;
    int Votes;
    int MaxFunds;
};

static const StateSeed StateSeeds[NumStates] = {
    {"Alabama", 9, 1},
    {"Alaska", 3, 1},
    {"Arizona", 11, 2},
    {"Arkansas", 6, 1},
    {"California", 55, 3},
    {"Colorado", 9, 1},
    {"Connecticut", 7, 1},
    {"Delaware", 3, 1},
    {"Florida", 29, 3},
    {"Georgia", 16, 2},
    {"Hawaii", 4, 1},
    {"Idaho", 4, 1},
    {"Illinois", 20, 2},
    {"Indiana", 11, 2},
    {"Iowa", 7, 1},
    {"Kansas", 6, 1},
    {"Kentucky", 8, 1},
    {"Louisiana", 8, 1},
    {"Maine", 4, 1},
    {"Maryland", 10, 1},
    {"Massachusetts", 11, 2},
    {"Michigan", 16, 2},
    {"Minnesota", 10, 1},
    {"Mississippi", 6, 1},
    {"Missouri", 10, 1},
    {"Montana", 3, 1},
    {"Nebraska", 5, 1},
    {"Nevada", 6, 1},
    {"New Hampshire", 4, 1},
    {"New Jersey", 14, 2},
    {"New Mexico", 5, 1},
    {"New York", 29, 3},
    {"North Carolina", 15, 2},
    {"North Dakota", 3, 1},
    {"Ohio", 18, 2},
    {"Oklahoma", 7, 1},
    {"Oregon", 7, 1},
    {"Pennsylvania", 20, 2},
    {"Rhode Island", 4, 1},
    {"South Carolina", 9, 1},
    {"South Dakota", 3, 1},
    {"Tennessee", 11, 2},
    {"Texas", 38, 3},
    {"Utah", 6, 1},
    {"Vermont", 3, 1},
    {"Virginia", 13, 2},
    {"Washington", 12, 2},
    {"West Virginia", 5, 1},
    {"Wisconsin", 10, 2},
    {"Wyoming", 3, 1},
};

// ===========================================================================
// Game model. Everything the bot needs to simulate lives in plain structs.
// Players are indexed 0 and 1 (Player One / Player Two).
// ===========================================================================

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

// A player may talk about a liked issue of the state that their party holds, or a disliked issue
// of the state that the opponent's party holds.
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

// Pick a random usable slot (the issue is irrelevant to the outcome, only the quiz differs).
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

// Winner of the exchange gains `Gain` momentum (max 3), the loser loses as much (min 0).
inline void boost(StateDyn &D, int Winner, int Gain)
{
    D.Mom[Winner] = static_cast<int8_t>(min(3, D.Mom[Winner] + Gain));
    D.Mom[1 - Winner] = static_cast<int8_t>(max(0, D.Mom[1 - Winner] - Gain));
}

// Legal moves for the player to move. `Prune` drops moves that are pointless for the bot to consider.
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

// Electoral votes held by player p (states not yet decided count for their current leader).
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

// ===========================================================================
// Evaluation: expected electoral-vote margin (Player One minus Player Two) if play stopped here.
// ===========================================================================

constexpr double SoftMomentum = 0.12; // win probability per point of momentum lead, early in the game
constexpr double SoftPercent = 0.20;  // win probability bonus for a big percentage lead
constexpr double FundValue = 4.0;     // worth of one spendable fund, in electoral votes
constexpr double ClaimValue = 1.5;    // worth of leading a state that is holding a fund

inline double clampd(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

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

inline double fundsTerm(int Funds0, int Funds1, int TurnsLeft)
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

// Expected change in marginOf() caused by a move, from the mover's point of view. Cheap enough to rank every move.
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

// ===========================================================================
// Opponent model
// ===========================================================================

struct AnswerStats
{
    int Correct = 0;
    int Total = 0;

    void record(bool Ok)
    {
        Total++;
        Correct += Ok ? 1 : 0;
    }

    // Bayesian estimate with a prior worth four answers at 65%.
    double estimate() const
    {
        return clampd((Correct + 0.65 * 4) / (Total + 4), 0.05, 0.95);
    }
};

// ===========================================================================
// Bot search: expectiminimax with alpha-beta, iterative deepening and a time budget.
//   * max nodes for the bot, min nodes for the opponent (assumed to play well),
//   * chance nodes for campaign answers (bot: its own accuracy, opponent: the learned estimate),
//   * polls are searched as their expected outcome (a 50/50 split),
//   * moves are ordered by moveGain() and only the best few are searched below the root (beam),
//   * forced moves (only "pass" available) do not consume depth.
// Values are in [-ValueBound, ValueBound] from the bot's point of view (a squashed margin).
// ===========================================================================

typedef chrono::steady_clock Clock;
constexpr double ValueBound = 1000.0;
static const double Inf = numeric_limits<double>::infinity();

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

    SearchResult think(const Sim &S, int MaxDepth, int TimeMs)
    {
        SearchResult R;
        ScoredMove List[MaxMoves];
        const int n = rank(S, List);
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

    // Moves for the player to move, best-looking first.
    int rank(const Sim &S, ScoredMove *List) const
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

private:
    const World &W;
    const int Me;
    const double PMe, POpp;
    Clock::time_point Deadline;
    long Nodes = 0;
    bool Aborted = false;
    bool CutByDepth = false;

    static int beamWidth(int Ply) { return Ply == 0 ? MaxMoves : (Ply == 1 ? 10 : (Ply == 2 ? 7 : 5)); }

    double leaf(const Sim &S) const
    {
        const int TurnsLeft = TotalTurns - S.Turn;
        const double V = ValueBound * tanh(marginOf(W, S) / (12.0 + 5.0 * TurnsLeft));
        return Me == 0 ? V : -V;
    }

    double child(const Sim &S, int p, const Move &M, bool Correct, int Depth, int Ply, double Alpha, double Beta)
    {
        Sim C = S;
        applyMove(C, p, M, Correct, 50);
        advanceStep(W, C);
        return search(C, Depth, Ply + 1, Alpha, Beta);
    }

    // Value of making move M: a plain child for deterministic moves, a chance node (quiz answer) for campaigns.
    // The chance node uses Star1 pruning: the window passed to each outcome assumes the others are as good or as
    // bad as the value bounds allow.
    double valueMove(const Sim &S, int p, const Move &M, int Depth, int Ply, double Alpha, double Beta)
    {
        if (M.K != Public && M.K != Advert)
        {
            return child(S, p, M, true, Depth, Ply, Alpha, Beta);
        }

        const double W0 = p == Me ? PMe : POpp, W1 = 1 - W0;
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

    double search(const Sim &S, int Depth, int Ply, double Alpha, double Beta)
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
};

// ===========================================================================
// Console helpers
// ===========================================================================

static bool Verbose = true;
static const string Rule(91, '-');

static void rule() { cout << Rule << endl; }

static string readLine(const string &Prompt)
{
    cout << Prompt;
    string Line;

    if (!getline(cin, Line))
    {
        cout << "\nInput closed. Exiting game." << endl;
        exit(0);
    }

    return Line;
}

static int readInt(const string &Prompt, int Lo, int Hi)
{
    for (;;)
    {
        const string Line = readLine(Prompt);
        char *End = nullptr;
        const long Value = strtol(Line.c_str(), &End, 10);

        if (End != Line.c_str())
        {
            while (*End == ' ' || *End == '\t' || *End == '\r')
            {
                End++;
            }

            if (*End == '\0' && Value >= Lo && Value <= Hi)
            {
                return static_cast<int>(Value);
            }
        }

        cout << "Please enter a number between " << Lo << " and " << Hi << "." << endl;
    }
}

static string readName(const string &Prompt)
{
    for (;;)
    {
        string Line = readLine(Prompt);
        const size_t First = Line.find_first_not_of(" \t\r");

        if (First != string::npos)
        {
            return Line.substr(First, Line.find_last_not_of(" \t\r") - First + 1);
        }
    }
}

static const char *playerWord(int p) { return p == 0 ? "One" : "Two"; }

// ===========================================================================
// Agents: whoever sits in a player's chair.
// ===========================================================================

struct Difficulty
{
    const char *Name;
    int Ms;           // thinking time per move
    int MaxDepth;     // plies
    double Accuracy;  // chance the bot answers a campaign question correctly
    double Blunder;   // chance it plays one of its top-3 moves at random instead of the best
};

static const Difficulty Levels[3] = {
    {"Easy", 100, 2, 0.55, 0.30},
    {"Medium", 500, 5, 0.75, 0.10},
    {"Hard", 1500, 9, 0.95, 0.0},
};

class Agent
{
public:
    virtual ~Agent() {}
    virtual bool isHuman() const { return false; }
    virtual void pickParty(World &W, int p) = 0;
    virtual Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) = 0;
    virtual bool answer(const string &Issue, const Qnos &Q) = 0; // true when answered correctly
};

class HumanAgent : public Agent
{
public:
    bool isHuman() const override { return true; }

    void pickParty(World &W, int p) override
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

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &) override
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

    bool answer(const string &Issue, const Qnos &Q) override
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

private:
    static const char *promptFor(Kind K)
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

    static string whyNot(const World &W, const Sim &S, int p, Kind K, int s)
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

    // Returns the chosen slot (0-9), or -1 to go back and pick another state.
    static int askIssue(const World &W, int p, int s)
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
};

class BotAgent : public Agent
{
public:
    explicit BotAgent(double Accuracy) : Accuracy(Accuracy) {}

    void pickParty(World &W, int p) override
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

    bool answer(const string &, const Qnos &) override
    {
        return uniform_real_distribution<double>(0, 1)(Rng) < Accuracy;
    }

protected:
    static Move withSlot(const World &W, int p, Move M)
    {
        if (M.K == Public || M.K == Advert)
        {
            M.Slot = static_cast<int8_t>(randomUsableSlot(W, p, M.State));
        }

        return M;
    }

private:
    double Accuracy;
};

// Expectiminimax bot. Models the opponent's quiz accuracy from the answers it has seen so far.
class SearchAgent : public BotAgent
{
public:
    explicit SearchAgent(const Difficulty &D) : BotAgent(D.Accuracy), D(D) {}

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) override
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

    long Decisions = 0;
    long DepthSum = 0;

private:
    Difficulty D;
};

// Baselines for --benchmark.
class GreedyAgent : public BotAgent
{
public:
    explicit GreedyAgent(double Accuracy) : BotAgent(Accuracy) {}

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) override
    {
        ScoredMove List[MaxMoves];
        Searcher(W, p, 0.7, Opponent.estimate()).rank(S, List);
        return withSlot(W, p, List[0].M);
    }
};

class RandomAgent : public BotAgent
{
public:
    explicit RandomAgent(double Accuracy) : BotAgent(Accuracy) {}

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &) override
    {
        Move Moves[MaxMoves];
        const int n = genMoves(W, S, Moves, false);
        return withSlot(W, p, Moves[Rng() % n]);
    }
};

// ===========================================================================
// The game: setup, turn loop and all console output.
// ===========================================================================

class Game
{
public:
    World W;
    Sim S;
    unique_ptr<Agent> Agents[2];
    AnswerStats Stats[2]; // how well each player has answered campaign questions

    void configureFromMenu()
    {
        rule();
        cout << "ELECTION SIMULATOR" << endl;
        rule();
        cout << "1. Play against the Bot\n2. Two players\n3. Watch Bot vs Bot" << endl;
        const int Mode = readInt("Select game mode : ", 1, 3);
        const Difficulty *Chosen[2] = {nullptr, nullptr};

        if (Mode == 1 || Mode == 3)
        {
            rule();
            cout << "Bot difficulty:\n1. Easy   - shallow search, makes mistakes, answers questions poorly\n2. Medium - looks a few moves ahead\n3. Hard   - deep search, answers almost every question correctly" << endl;
        }

        if (Mode == 1)
        {
            const Difficulty &L = Levels[readInt("Select Bot difficulty : ", 1, 3) - 1];
            const int Human = readInt("Play as Player One (moves first in each phase) or Player Two? (1/2) : ", 1, 2) - 1;
            Agents[Human].reset(new HumanAgent());
            Chosen[1 - Human] = &L;
        }
        else if (Mode == 2)
        {
            Agents[0].reset(new HumanAgent());
            Agents[1].reset(new HumanAgent());
        }
        else
        {
            Chosen[0] = &Levels[readInt("Select difficulty of Bot One : ", 1, 3) - 1];
            Chosen[1] = &Levels[readInt("Select difficulty of Bot Two : ", 1, 3) - 1];
        }

        for (int p = 0; p < 2; p++)
        {
            if (Chosen[p])
            {
                Agents[p].reset(new SearchAgent(*Chosen[p]));
                W.PlayerName[p] = Mode == 3 ? string("Bot ") + playerWord(p) + " (" + Chosen[p]->Name + ")" : string("Bot (") + Chosen[p]->Name + ")";
                W.PartyName[p] = "Bot Party";
            }
        }

        rule();

        for (int p = 0; p < 2; p++)
        {
            if (Agents[p]->isHuman())
            {
                W.PlayerName[p] = readName(string("Enter Player ") + playerWord(p) + " Name : ");
                W.PartyName[p] = readName(string("Enter Player ") + playerWord(p) + " Political Party Name : ");
                rule();
            }
        }
    }

    // Parties pick their issues, then every state draws the issues it likes and dislikes.
    void setupWorld()
    {
        for (int p = 0; p < 2; p++)
        {
            if (Verbose && Agents[p]->isHuman())
            {
                cout << "Player " << playerWord(p) << " Turns : " << endl;
            }

            Agents[p]->pickParty(W, p);

            if (Verbose && Agents[p]->isHuman())
            {
                rule();
            }
        }

        assignStateIssues(W);
        computeUsable(W);
        S = Sim();

        for (int s = 0; s < NumStates; s++)
        {
            S.St[s].Funds = static_cast<int8_t>(W.States[s].MaxFunds);

            if (s % 4 == 0) // a few states start with a (narrow) poll lead
            {
                S.St[s].Pct[0] = static_cast<int16_t>(49 + Rng() % 3);
                S.St[s].Pct[1] = static_cast<int16_t>(100 - S.St[s].Pct[0]);
            }
        }
    }

    void play()
    {
        while (!terminal(S))
        {
            const int Step = S.Step, p = Step & 1;

            if (Verbose && p == 0)
            {
                announcePhase(kindOfStep(Step));
            }

            const Move M = Agents[p]->chooseMove(W, S, p, Stats[1 - p]);
            execute(p, M);
            advanceStep(W, S);

            if (Verbose && Step == 5 && !hasHuman())
            {
                cout << "End of turn " << static_cast<int>(S.Turn) << " : " << tally(W, S, 0) << " - " << tally(W, S, 1) << " electoral votes" << endl;
            }
        }

        finalizeGame(S);

        if (Verbose)
        {
            showResult();
        }
    }

    int winner() const { return tally(W, S, 0) > tally(W, S, 1) ? 0 : 1; } // a tie goes to Player Two

private:
    bool hasHuman() const { return Agents[0]->isHuman() || Agents[1]->isHuman(); }

    void showCandidate(int p) const
    {
        cout << "Name : " << W.PlayerName[p] << endl;
        cout << "Electoral Votes : " << tally(W, S, p) << endl;
        cout << "Funds : " << S.Funds[p] << endl;
        cout << "Political Party : " << W.PartyName[p] << endl;
        rule();
        cout << "Candidates's Party Supported Issues" << endl;
        rule();

        for (int j = 0; j < PartySize; j++)
        {
            cout << IssuesArray[W.PartyIssue[p][j]].Name << endl;
        }
    }

    void showCandidates() const
    {
        for (int p = 0; p < 2; p++)
        {
            cout << "Player " << playerWord(p) << " Information" << endl;
            showCandidate(p);
            rule();
        }
    }

    void showStates() const
    {
        cout << "States Information" << endl;
        rule();
        cout << left << setw(20) << " Name" << " | Votes | %Of 1 | %Of 2 | M  P1 | M  P2 | Funds | Leading By |" << endl;
        rule();

        for (int s = 0; s < NumStates; s++)
        {
            const StateDyn &D = S.St[s];
            const int Lead = D.Pct[0] > D.Pct[1] ? 0 : (D.Pct[1] > D.Pct[0] ? 1 : -1);
            string Leading = Lead < 0 ? "None" : string("Player ") + static_cast<char>('1' + Lead);

            if (D.Winner >= 0)
            {
                Leading += "*";
            }

            cout << right << setw(2) << s + 1 << ")" << left << setw(17) << W.States[s].Name << " | " << right;
            cout << setw(5) << W.States[s].Votes << " | " << setw(5) << D.Pct[0] << " | " << setw(5) << D.Pct[1] << " | ";
            cout << setw(5) << static_cast<int>(D.Mom[0]) << " | " << setw(5) << static_cast<int>(D.Mom[1]) << " | ";
            cout << setw(5) << static_cast<int>(D.Funds) << " | " << setw(10) << Leading << " |" << endl;
        }

        cout << "(* = state already won)" << endl;
    }

    void announcePhase(Kind K) const
    {
        static const char *Titles[4] = {"Polling Time", "Campaign Time", "Advertisement Campaign Time", "Funding Time"};

        if (K == Poll)
        {
            cout << "\n======================================== Turn " << S.Turn + 1 << " of " << TotalTurns << " ========================================" << endl;
        }

        if (hasHuman())
        {
            showCandidates();
            cout << endl;
            showStates();
            cout << endl;
        }

        cout << "||*****|| " << Titles[S.Step / 2] << " ||*****||" << endl;
    }

    void execute(int p, const Move &M)
    {
        const string &Who = W.PlayerName[p];
        bool Correct = true;
        int Roll = 50;
        int Gained = 0;

        if (M.K != Pass)
        {
            const StateInfo &Si = W.States[M.State];

            if (M.K == Poll)
            {
                Roll = 49 + static_cast<int>(Rng() % 3);
            }
            else if (M.K == TakeFunds)
            {
                Gained = S.St[M.State].Funds;
            }
            else
            {
                Correct = Agents[p]->answer(IssuesArray[issueOfSlot(Si, M.Slot)].Name, questionOfSlot(Si, M.Slot));
                Stats[p].record(Correct);
            }
        }

        applyMove(S, p, M, Correct, Roll);

        if (!Verbose)
        {
            return;
        }

        const char *Name = M.K == Pass ? "" : W.States[M.State].Name;
        const int Gain = M.K == Public ? 2 : 1;

        switch (M.K)
        {
        case Pass:
            cout << Who << " ends the turn." << endl;
            break;
        case Poll:
            cout << Who << " held polling in " << Name << " : " << Roll << "% - " << 100 - Roll << "%" << endl;
            break;
        case TakeFunds:
            cout << Who << " took " << Gained << " fund(s) from " << Name << "." << endl;
            break;
        default:
            cout << Who << (M.K == Public ? " campaigned publicly in " : " ran advertisements in ") << Name << " on '" << IssuesArray[issueOfSlot(W.States[M.State], M.Slot)].Name << "' : ";

            if (Correct)
            {
                cout << "correct answer, momentum +" << Gain << " for " << Who << endl;
            }
            else
            {
                cout << "wrong answer. People Of " << Name << " are not happy with the recent campaign, momentum +" << Gain << " for " << W.PlayerName[1 - p] << endl;
            }
        }
    }

    void showResult() const
    {
        cout << endl;
        showStates();
        rule();

        const int Win = winner();
        cout << "Electoral Votes : " << W.PlayerName[0] << " " << tally(W, S, 0) << " - " << tally(W, S, 1) << " " << W.PlayerName[1] << endl;

        if (tally(W, S, 0) == tally(W, S, 1))
        {
            cout << "The electoral votes are tied, the tiebreak goes to Player Two." << endl;
        }

        cout << "Player " << playerWord(Win) << " (" << W.PlayerName[Win] << ") Wins !!!" << endl;
        rule();
        showCandidates();

        for (int p = 0; p < 2; p++)
        {
            if (Agents[p]->isHuman() && Stats[p].Total > 0 && !(Agents[1 - p]->isHuman()))
            {
                cout << "The bot's read on " << W.PlayerName[p] << ": " << Stats[p].Correct << " of " << Stats[p].Total << " questions answered correctly." << endl;
                rule();
            }
        }
    }
};

// ===========================================================================
// Benchmark: the bot against baselines, alternating sides.
// ===========================================================================

static int runBenchmark(int Games, int Ms, unsigned Seed)
{
    Rng.seed(Seed);
    Verbose = false;
    const Difficulty Bench = {"Benchmark", Ms, 12, 0.8, 0.0};
    const char *Names[2] = {"random", "greedy (1-ply)"};

    cout << "Bot (" << Ms << " ms/move, 80% quiz accuracy) vs baselines (80% quiz accuracy), " << Games << " games each, sides alternate" << endl;

    for (int o = 0; o < 2; o++)
    {
        int Wins = 0;
        double MarginSum = 0, DepthSum = 0, Decisions = 0;
        const Clock::time_point Start = Clock::now();

        for (int g = 0; g < Games; g++)
        {
            Game G;
            const int BotSide = g % 2;
            SearchAgent *Bot = new SearchAgent(Bench);

            G.Agents[BotSide].reset(Bot);

            if (o == 0)
            {
                G.Agents[1 - BotSide].reset(new RandomAgent(0.8));
            }
            else
            {
                G.Agents[1 - BotSide].reset(new GreedyAgent(0.8));
            }

            G.W.PlayerName[0] = "A";
            G.W.PlayerName[1] = "B";
            G.setupWorld();
            G.play();

            Wins += G.winner() == BotSide ? 1 : 0;
            MarginSum += tally(G.W, G.S, BotSide) - tally(G.W, G.S, 1 - BotSide);
            DepthSum += Bot->DepthSum;
            Decisions += Bot->Decisions;
        }

        cout << "  vs " << left << setw(15) << Names[o] << right << ": bot wins " << Wins << "/" << Games << ", average margin " << showpos << fixed << setprecision(1) << MarginSum / Games << noshowpos << " EV, average search depth " << (Decisions > 0 ? DepthSum / Decisions : 0) << ", " << chrono::duration<double>(Clock::now() - Start).count() << "s" << endl;
    }

    return 0;
}

int main(int argc, char **argv)
{
    if (argc > 1 && string(argv[1]) == "--benchmark")
    {
        return runBenchmark(argc > 2 ? atoi(argv[2]) : 20, argc > 3 ? atoi(argv[3]) : 100, argc > 4 ? static_cast<unsigned>(atoi(argv[4])) : 1u);
    }

    Game G;
    G.configureFromMenu();
    G.setupWorld();
    G.play();

    return 0;
}
