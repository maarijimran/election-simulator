// Election Simulator
//
// Two players (human or bot) fight for the electoral votes of 50 states over 20 turns.
//
// The bot is an expectiminimax searcher: minimax over the two players' moves, expectation over the
// campaign quiz answers, alpha-beta pruning (Star1 bounds at chance nodes), iterative deepening under
// a time budget, heuristic move ordering with a beam, and an opponent model that learns how often
// the human answers questions correctly.
//
// Build:  g++ -std=c++14 -O2 *.cpp -o election-simulator
// Extras: election-simulator --benchmark [games] [ms per move] [seed]   (bot vs random / greedy baselines)

#include "benchmark.h"
#include "game.h"

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
