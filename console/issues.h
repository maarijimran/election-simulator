#pragma once

#include "common.h"

struct Ans
{
    string Answer;
    bool IsTrue;
    int Num;
};

struct Qnos
{
    string Question;
    Ans Answers[3];
};

struct Issues
{
    string Name;
    Qnos Supported;
    Qnos NotSupported;

    Issues() {}

    Issues(string IssueName, string SPQuestion, string SPAns1, bool IsTrue1, int Num1, string SPAns2, bool IsTrue2, int Num2, string SPAns3, bool IsTrue3, int Num3, string NSPQuestion, string NSPAns1, bool NIsTrue1, int NNum1, string NSPAns2, bool NIsTrue2, int NNum2, string NSPAns3, bool NIsTrue3, int NNum3)
    {
        Name = IssueName;
        Supported.Question = SPQuestion;
        Supported.Answers[0] = {SPAns1, IsTrue1, Num1};
        Supported.Answers[1] = {SPAns2, IsTrue2, Num2};
        Supported.Answers[2] = {SPAns3, IsTrue3, Num3};

        NotSupported.Question = NSPQuestion;
        NotSupported.Answers[0] = {NSPAns1, NIsTrue1, NNum1};
        NotSupported.Answers[1] = {NSPAns2, NIsTrue2, NNum2};
        NotSupported.Answers[2] = {NSPAns3, NIsTrue3, NNum3};
    }
};

extern const Issues IssuesArray[NumIssues];
