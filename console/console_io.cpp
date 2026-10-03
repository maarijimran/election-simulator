#include "console_io.h"

bool Verbose = true;
static const string Rule(91, '-');

void rule() { cout << Rule << endl; }

string readLine(const string &Prompt)
{
    cout << Prompt;
    string Line;

    if (!getline(cin, Line))
    {
        cout << "\nInput closed. Exiting game." << endl;
        exit(0);
    }

    return Line;
}

int readInt(const string &Prompt, int Lo, int Hi)
{
    for (;;)
    {
        const string Line = readLine(Prompt);
        char *End = nullptr;
        const long Value = strtol(Line.c_str(), &End, 10);

        if (End != Line.c_str())
        {
            while (*End == ' ' || *End == '\t' || *End == '\r')
            {
                End++;
            }

            if (*End == '\0' && Value >= Lo && Value <= Hi)
            {
                return static_cast<int>(Value);
            }
        }

        cout << "Please enter a number between " << Lo << " and " << Hi << "." << endl;
    }
}

string readName(const string &Prompt)
{
    for (;;)
    {
        string Line = readLine(Prompt);
        const size_t First = Line.find_first_not_of(" \t\r");

        if (First != string::npos)
        {
            return Line.substr(First, Line.find_last_not_of(" \t\r") - First + 1);
        }
    }
}

const char *playerWord(int p) { return p == 0 ? "One" : "Two"; }
