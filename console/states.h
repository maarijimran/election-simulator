#pragma once

#include "common.h"

struct StateSeed
{
    const char *Name;
    int Votes;
    int MaxFunds;
};

extern const StateSeed StateSeeds[NumStates];
