#pragma once

#include "model.h"

// Evaluation: expected electoral-vote margin (Player One minus Player Two) if play stopped here.

double stateTerm(const StateInfo &Si, const StateDyn &D, int TurnsLeft);

double fundsTerm(int Funds0, int Funds1, int TurnsLeft);

double marginOf(const World &W, const Sim &S);

// Expected change in marginOf() caused by a move, from the mover's point of view. Cheap enough to rank every move.
double moveGain(const World &W, const Sim &S, int p, const Move &M, double PCorrect);
