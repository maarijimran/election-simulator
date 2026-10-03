#pragma once

#include "model.h"
#include "opponent.h"

class Agent
{
public:
    virtual ~Agent() {}
    virtual bool isHuman() const { return false; }
    virtual void pickParty(World &W, int p) = 0;
    virtual Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) = 0;
    virtual bool answer(const string &Issue, const Qnos &Q) = 0; // true when answered correctly
};
