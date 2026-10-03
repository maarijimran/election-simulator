#pragma once

#include "agent.h"

class HumanAgent : public Agent
{
public:
    bool isHuman() const override { return true; }

    void pickParty(World &W, int p) override;

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &) override;

    bool answer(const string &Issue, const Qnos &Q) override;

private:
    static const char *promptFor(Kind K);

    static string whyNot(const World &W, const Sim &S, int p, Kind K, int s);

    // Returns the chosen slot (0-9), or -1 to go back and pick another state.
    static int askIssue(const World &W, int p, int s);
};
