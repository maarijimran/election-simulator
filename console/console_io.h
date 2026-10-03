#pragma once

#include "common.h"

extern bool Verbose;

void rule();
string readLine(const string &Prompt);
int readInt(const string &Prompt, int Lo, int Hi);
string readName(const string &Prompt);
const char *playerWord(int p);
