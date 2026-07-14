# todo-cli

![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-active-brightgreen)

A task manager for the terminal that ranks your tasks by **urgency**, not just priority.

Most to-do apps let a task sit at "high priority" forever without it ever feeling more pressing than the day you added it. This one doesn't. Urgency climbs the longer a task goes untouched — fast for high-priority items, slow for low-priority ones — and overdue tasks get pushed further up the list automatically.

## Why

- **Priority alone lies.** A "high" task from five minutes ago and one from three days ago shouldn't look the same in your list.
- **Deadlines should hurt more over time.** Being one hour overdue is different from being three days overdue.
- **No dependencies.** Just Python's standard library plus `sqlite3`, which ships with Python.

## Install

```bash
git clone <this-repo>
cd todo-cli
python3 main.py list
```

No `pip install` required. Tasks persist to a local SQLite file at `~/.todo_cli.db`.

## Usage

```bash
# add a task
python3 main.py add "Ship the release" --priority high --due-in 2 --tags work,urgent

# view open tasks, most urgent first
python3 main.py list

# view everything, including completed tasks
python3 main.py all

# mark a task done / reopen it
python3 main.py done 1
python3 main.py reopen 1

# delete a task
python3 main.py rm 1
```

### Example output

```
Open tasks, most urgent first:
  [ ] #1   ▇▇▇  Ship the release [work, urgent]  (High, due Jul 14 07:31)
  [!] #3   ▅▅▅  Reply to emails  (Medium, due Jul 14 04:31)
  [ ] #2   ▁▁▁  Read a book  (Low, due no deadline)
```

`!` marks an overdue task. The bar is a quick visual read of the computed urgency score.

## How urgency is calculated

Each task's score grows exponentially from its priority toward a ceiling, using a half-life that depends on priority:

| Priority | Half-life  |
|----------|------------|
| High     | 6 hours    |
| Medium   | 24 hours   |
| Low      | 72 hours   |

Overdue tasks get an additional `+0.5` per hour overdue, capped at `+10`. The full logic lives in [`todo/models.py`](todo/models.py).

## Project structure

```
todo-cli/
├── main.py            # entry point
├── models.py       # Task dataclass + urgency scoring
├── storage.py      # SQLite persistence
├── service.py      # business logic (create, complete, rank)
├── display.py      # terminal rendering
└── cli.py         # argparse wiring
└─ README.md
```

Each layer only knows about the one below it: `cli.py` calls `service.py`, `service.py` calls `storage.py`. Swap SQLite for Postgres later and only `storage.py` changes.

## Options

| Flag          | Applies to | Description                          |
|---------------|-----------|---------------------------------------|
| `--priority`  | `add`     | `low`, `medium`, or `high`            |
| `--due-in`    | `add`     | Hours from now until the task is due  |
| `--tags`      | `add`     | Comma-separated tags                  |
| `--db`        | any       | Path to the SQLite database to use    |

## License

MIT
