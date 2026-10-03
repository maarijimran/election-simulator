#pragma once

#include "common.h"

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
