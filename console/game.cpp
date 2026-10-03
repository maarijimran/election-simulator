#include "game.h"
#include "bot_agents.h"
#include "console_io.h"
#include "difficulty.h"
#include "human_agent.h"
#include "issues.h"

void Game::configureFromMenu()
{
    rule();
    cout << "ELECTION SIMULATOR" << endl;
    rule();
    cout << "1. Play against the Bot\n2. Two players\n3. Watch Bot vs Bot" << endl;
    const int Mode = readInt("Select game mode : ", 1, 3);
    const Difficulty *Chosen[2] = {nullptr, nullptr};

    if (Mode == 1 || Mode == 3)
    {
        rule();
        cout << "Bot difficulty:\n1. Easy   - shallow search, makes mistakes, answers questions poorly\n2. Medium - looks a few moves ahead\n3. Hard   - deep search, answers almost every question correctly" << endl;
    }

    if (Mode == 1)
    {
        const Difficulty &L = Levels[readInt("Select Bot difficulty : ", 1, 3) - 1];
        const int Human = readInt("Play as Player One (moves first in each phase) or Player Two? (1/2) : ", 1, 2) - 1;
        Agents[Human].reset(new HumanAgent());
        Chosen[1 - Human] = &L;
    }
    else if (Mode == 2)
    {
        Agents[0].reset(new HumanAgent());
        Agents[1].reset(new HumanAgent());
    }
    else
    {
        Chosen[0] = &Levels[readInt("Select difficulty of Bot One : ", 1, 3) - 1];
        Chosen[1] = &Levels[readInt("Select difficulty of Bot Two : ", 1, 3) - 1];
    }

    for (int p = 0; p < 2; p++)
    {
        if (Chosen[p])
        {
            Agents[p].reset(new SearchAgent(*Chosen[p]));
            W.PlayerName[p] = Mode == 3 ? string("Bot ") + playerWord(p) + " (" + Chosen[p]->Name + ")" : string("Bot (") + Chosen[p]->Name + ")";
            W.PartyName[p] = "Bot Party";
        }
    }

    rule();

    for (int p = 0; p < 2; p++)
    {
        if (Agents[p]->isHuman())
        {
            W.PlayerName[p] = readName(string("Enter Player ") + playerWord(p) + " Name : ");
            W.PartyName[p] = readName(string("Enter Player ") + playerWord(p) + " Political Party Name : ");
            rule();
        }
    }
}

void Game::setupWorld()
{
    for (int p = 0; p < 2; p++)
    {
        if (Verbose && Agents[p]->isHuman())
        {
            cout << "Player " << playerWord(p) << " Turns : " << endl;
        }

        Agents[p]->pickParty(W, p);

        if (Verbose && Agents[p]->isHuman())
        {
            rule();
        }
    }

    assignStateIssues(W);
    computeUsable(W);
    S = Sim();
    S.Offset = static_cast<int8_t>(Rng() & 1);

    for (int s = 0; s < NumStates; s++)
    {
        S.St[s].Funds = static_cast<int8_t>(W.States[s].MaxFunds);

        if (s % 4 == 0) // a few states start with a (narrow) poll lead
        {
            S.St[s].Pct[0] = static_cast<int16_t>(49 + Rng() % 3);
            S.St[s].Pct[1] = static_cast<int16_t>(100 - S.St[s].Pct[0]);
        }
    }
}

void Game::play()
{
    if (Verbose)
    {
        cout << "Coin toss : " << W.PlayerName[firstMover(S)] << " acts first." << endl;
    }

    while (!terminal(S))
    {
        const int Step = S.Step, p = moverOf(S);

        if (Verbose && (Step & 1) == 0)
        {
            announcePhase(kindOfStep(Step));
        }

        const Move M = Agents[p]->chooseMove(W, S, p, Stats[1 - p]);
        execute(p, M);
        advanceStep(W, S);

        if (Verbose && Step == 5 && !hasHuman())
        {
            cout << "End of turn " << static_cast<int>(S.Turn) << " : " << tally(W, S, 0) << " - " << tally(W, S, 1) << " electoral votes" << endl;
        }
    }

    finalizeGame(S);

    if (Verbose)
    {
        showResult();
    }
}

void Game::showCandidate(int p) const
{
    cout << "Name : " << W.PlayerName[p] << endl;
    cout << "Electoral Votes : " << tally(W, S, p) << endl;
    cout << "Funds : " << S.Funds[p] << endl;
    cout << "Political Party : " << W.PartyName[p] << endl;
    rule();
    cout << "Candidates's Party Supported Issues" << endl;
    rule();

    for (int j = 0; j < PartySize; j++)
    {
        cout << IssuesArray[W.PartyIssue[p][j]].Name << endl;
    }
}

void Game::showCandidates() const
{
    for (int p = 0; p < 2; p++)
    {
        cout << "Player " << playerWord(p) << " Information" << endl;
        showCandidate(p);
        rule();
    }
}

void Game::showStates() const
{
    cout << "States Information" << endl;
    rule();
    cout << left << setw(20) << " Name" << " | Votes | %Of 1 | %Of 2 | M  P1 | M  P2 | Funds | Leading By |" << endl;
    rule();

    for (int s = 0; s < NumStates; s++)
    {
        const StateDyn &D = S.St[s];
        const int Lead = D.Pct[0] > D.Pct[1] ? 0 : (D.Pct[1] > D.Pct[0] ? 1 : -1);
        string Leading = Lead < 0 ? "None" : string("Player ") + static_cast<char>('1' + Lead);

        if (D.Winner >= 0)
        {
            Leading += "*";
        }

        cout << right << setw(2) << s + 1 << ")" << left << setw(17) << W.States[s].Name << " | " << right;
        cout << setw(5) << W.States[s].Votes << " | " << setw(5) << D.Pct[0] << " | " << setw(5) << D.Pct[1] << " | ";
        cout << setw(5) << static_cast<int>(D.Mom[0]) << " | " << setw(5) << static_cast<int>(D.Mom[1]) << " | ";
        cout << setw(5) << static_cast<int>(D.Funds) << " | " << setw(10) << Leading << " |" << endl;
    }

    cout << "(* = state already won)" << endl;
}

void Game::announcePhase(Kind K) const
{
    static const char *Titles[4] = {"Polling Time", "Campaign Time", "Advertisement Campaign Time", "Funding Time"};

    if (K == Poll)
    {
        cout << "\n======================================== Turn " << S.Turn + 1 << " of " << TotalTurns << " ========================================" << endl;
    }

    if (hasHuman())
    {
        showCandidates();
        cout << endl;
        showStates();
        cout << endl;
    }

    cout << "||*****|| " << Titles[S.Step / 2] << " ||*****||" << endl;
    cout << W.PlayerName[firstMover(S)] << " acts first in this phase." << endl;
}

void Game::execute(int p, const Move &M)
{
    const string &Who = W.PlayerName[p];
    bool Correct = true;
    int Roll = 50;
    int Gained = 0;

    if (M.K == Poll)
    {
        Roll = 49 + static_cast<int>(Rng() % 3);
    }
    else if (M.K == TakeFunds)
    {
        Gained = S.St[M.State].Funds;
    }
    else if (isCampaign(M.K))
    {
        const StateInfo &Si = W.States[M.State];
        Correct = Agents[p]->answer(IssuesArray[issueOfSlot(Si, M.Slot)].Name, questionOfSlot(Si, M.Slot));
        Stats[p].record(Correct);
    }
    else if (M.K == Scandal)
    {
        Correct = uniform_real_distribution<double>(0, 1)(Rng) < ScandalChance;
    }

    applyMove(S, p, M, Correct, Roll);

    if (!Verbose)
    {
        return;
    }

    const char *Name = M.State >= 0 ? W.States[M.State].Name : "";
    const int Gain = gainOf(M.K);

    switch (M.K)
    {
    case Pass:
        cout << Who << " ends the turn." << endl;
        break;
    case Poll:
        cout << Who << " held polling in " << Name << " : " << Roll << "% - " << 100 - Roll << "%" << endl;
        break;
    case TakeFunds:
        cout << Who << " took " << Gained << " fund(s) from " << Name << "." << endl;
        break;
    case Celebrity:
        cout << Who << " landed a celebrity endorsement in " << Name << " : momentum +" << Gain << " for " << Who << endl;
        break;
    case Scandal:
        if (Correct)
        {
            cout << Who << " leaked a scandal in " << Name << " : " << W.PlayerName[1 - p] << " loses 2 momentum" << endl;
        }
        else
        {
            cout << Who << "'s scandal in " << Name << " backfired : " << Who << " loses 2 momentum" << endl;
        }
        break;
    case Fundraiser:
        cout << Who << " held a fundraiser : +" << FundraiserGain << " funds" << endl;
        break;
    default:
        cout << Who << (M.K == Public ? " campaigned publicly in " : " ran advertisements in ") << Name << " on '" << IssuesArray[issueOfSlot(W.States[M.State], M.Slot)].Name << "' : ";

        if (Correct)
        {
            cout << "correct answer, momentum +" << Gain << " for " << Who << endl;
        }
        else
        {
            cout << "wrong answer. People Of " << Name << " are not happy with the recent campaign, momentum +" << Gain << " for " << W.PlayerName[1 - p] << endl;
        }
    }
}

void Game::showResult() const
{
    cout << endl;
    showStates();
    rule();

    const int Win = winner();
    cout << "Electoral Votes : " << W.PlayerName[0] << " " << tally(W, S, 0) << " - " << tally(W, S, 1) << " " << W.PlayerName[1] << endl;

    if (tally(W, S, 0) == tally(W, S, 1))
    {
        cout << "The electoral votes are tied, the tiebreak goes to Player Two." << endl;
    }

    cout << "Player " << playerWord(Win) << " (" << W.PlayerName[Win] << ") Wins !!!" << endl;
    rule();
    showCandidates();

    for (int p = 0; p < 2; p++)
    {
        if (Agents[p]->isHuman() && Stats[p].Total > 0 && !(Agents[1 - p]->isHuman()))
        {
            cout << "The bot's read on " << W.PlayerName[p] << ": " << Stats[p].Correct << " of " << Stats[p].Total << " questions answered correctly." << endl;
            rule();
        }
    }
}
