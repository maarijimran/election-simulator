#pragma once

#include "common.h"

struct Difficulty
{
    const char *Name;
    int Ms;           // thinking time per move
    int MaxDepth;     // plies
    double Accuracy;  // chance the bot answers a campaign question correctly
    double Blunder;   // chance it plays one of its top-3 moves at random instead of the best
};

extern const Difficulty Levels[3];
