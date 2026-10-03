#pragma once

#include "agent.h"
#include "difficulty.h"
#include "search.h"

class BotAgent : public Agent
{
public:
    explicit BotAgent(double Accuracy) : Accuracy(Accuracy) {}

    void pickParty(World &W, int p) override;

    bool answer(const string &, const Qnos &) override;

protected:
    static Move withSlot(const World &W, int p, Move M);

private:
    double Accuracy;
};

// Expectiminimax bot. Models the opponent's quiz accuracy from the answers it has seen so far.
class SearchAgent : public BotAgent
{
public:
    explicit SearchAgent(const Difficulty &D) : BotAgent(D.Accuracy), D(D) {}

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) override;

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

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &Opponent) override;
};

class RandomAgent : public BotAgent
{
public:
    explicit RandomAgent(double Accuracy) : BotAgent(Accuracy) {}

    Move chooseMove(const World &W, const Sim &S, int p, const AnswerStats &) override;
};
