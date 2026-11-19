# Expense Splitter

A small command-line tool to split shared expenses (food, rent, utilities) between flatmates and see who owes whom.

## Setup

Requires Node.js.

```bash
npm install
npm start
```

## Usage

```bash
node src/cli.js add --desc "Pizza" --amount 90 --payer Almaz --with Almaz,Dana,Timur
node src/cli.js add --desc "Rent" --amount 300 --payer Dana --with Almaz,Dana --mode percent --weights 40,60
node src/cli.js list
node src/cli.js balance
node src/cli.js settle
```

Data is saved to `expenses.json`.

## Tests

```bash
npm test
```
