# Expense Splitter

A small command-line tool to split shared expenses (food, rent, utilities) between flatmates and see who owes whom.

## Setup

Requires Node.js 20 or newer. There are no runtime dependencies.

```bash
npm install
```

## Usage

```bash
node src/cli.js add --desc "Pizza" --amount 90 --payer Almaz --with Almaz,Dana,Timur
node src/cli.js add --desc "Rent" --amount 300 --payer Dana --with Almaz,Dana --mode percent --weights 40,60
node src/cli.js add --desc "Tickets" --amount 50 --payer Timur --with Almaz,Timur --mode exact --weights 20,30
node src/cli.js list
node src/cli.js balance
node src/cli.js settle
node src/cli.js reset      # deletes all expenses
```

`npm run dev -- <command>` is a shortcut for `node src/cli.js <command>`.

Split modes: `equal` (default), `percent` (weights are percentages), `exact` (weights are amounts).

Data is saved to `expenses.json` in the current folder, or to the path in the `EXPENSES_FILE` environment variable.

## Tests

```bash
npm test
```

Acceptance criteria are listed in [docs/ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md). Instructions for coding agents are in [AGENTS.md](AGENTS.md).

## Project structure

```
src/cli.js        entry point (argument parsing, output)
src/splitter.js   business logic (shares, balances, settlement)
src/storage.js    JSON data file
test/             node:test tests
docs/             acceptance criteria and audit documents
```
