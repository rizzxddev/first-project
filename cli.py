import argparse
import sys
from pathlib import Path

from .display import render_list
from .service import TaskService
from .storage import TaskStore

DEFAULT_DB = Path.home() / ".todo_cli.db"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="todo", description="Urgency-ranked task manager.")
    parser.add_argument("--db", default=str(DEFAULT_DB), help="path to the SQLite database")
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_p = subparsers.add_parser("add", help="add a new task")
    add_p.add_argument("title")
    add_p.add_argument("--priority", default="medium", choices=["low", "medium", "high"])
    add_p.add_argument("--due-in", type=float, default=None, help="hours until the task is due")
    add_p.add_argument("--tags", default="", help="comma-separated tags")

    subparsers.add_parser("list", help="show open tasks ranked by urgency")
    subparsers.add_parser("all", help="show every task including completed ones")

    done_p = subparsers.add_parser("done", help="mark a task complete")
    done_p.add_argument("id", type=int)

    reopen_p = subparsers.add_parser("reopen", help="reopen a completed task")
    reopen_p.add_argument("id", type=int)

    rm_p = subparsers.add_parser("rm", help="delete a task")
    rm_p.add_argument("id", type=int)

    return parser


def run(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    store = TaskStore(args.db)
    service = TaskService(store)

    try:
        if args.command == "add":
            tags = [t.strip() for t in args.tags.split(",") if t.strip()]
            task = service.create_task(args.title, args.priority, args.due_in, tags)
            print(f"added #{task.id}: {task.title}")

        elif args.command == "list":
            print(render_list(service.ranked_open_tasks(), "Open tasks, most urgent first:"))

        elif args.command == "all":
            print(render_list(service.all_tasks(), "All tasks:"))

        elif args.command == "done":
            task = service.complete_task(args.id)
            print(f"completed #{task.id}: {task.title}")

        elif args.command == "reopen":
            task = service.reopen_task(args.id)
            print(f"reopened #{task.id}: {task.title}")

        elif args.command == "rm":
            service.delete_task(args.id)
            print(f"deleted #{args.id}")

    except (KeyError, ValueError) as err:
        print(f"error: {err}", file=sys.stderr)
        return 1
    finally:
        store.close()

    return 0


if __name__ == "__main__":
    sys.exit(run())
  
