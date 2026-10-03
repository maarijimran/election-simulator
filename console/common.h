#pragma once

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <ctime>
#include <iomanip>
#include <iostream>
#include <limits>
#include <memory>
#include <random>
#include <sstream>
#include <string>
#include <vector>
using namespace std;

constexpr int NumIssues = 20;
constexpr int NumStates = 50;
constexpr int PartySize = 5;
constexpr int TotalTurns = 20;
constexpr int StepsPerTurn = 8; // poll, public campaign, advertisement, funding: one step per player each
constexpr int MaxMoves = 64;    // pass + at most one move per state

extern mt19937 Rng;

inline double clampd(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
