#pragma once

#include "agent.h"

class Game
{
public:
    World W;
    Sim S;
    unique_ptr<Agent> Agents[2];
    AnswerStats Stats[2]; // how well each player has answered campaign questions

    void configureFromMenu();

    // Parties pick their issues, then every state draws the issues it likes and dislikes.
    void setupWorld();

    void play();

    int winner() const { return tally(W, S, 0) > tally(W, S, 1) ? 0 : 1; } // a tie goes to Player Two

private:
    bool hasHuman() const { return Agents[0]->isHuman() || Agents[1]->isHuman(); }

    void showCandidate(int p) const;

    void showCandidates() const;

    void showStates() const;

    void announcePhase(Kind K) const;

    void execute(int p, const Move &M);

    void showResult() const;
};
