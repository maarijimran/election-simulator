#include "benchmark.h"
#include "bot_agents.h"
#include "console_io.h"
#include "game.h"
#include "search.h"

int runBenchmark(int Games, int Ms, unsigned Seed)
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
