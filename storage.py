import sqlite3
from pathlib import Path

from .models import Task

SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    priority INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    due_at TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    tags TEXT DEFAULT ''
);
"""


class TaskStore:
    def __init__(self, db_path: str | Path):
        self.db_path = Path(db_path)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.execute(SCHEMA)
        self.conn.commit()

    def add(self, task: Task) -> Task:
        row = task.to_row()
        row.pop("id")
        cursor = self.conn.execute(
            """INSERT INTO tasks (title, priority, created_at, due_at, done, completed_at, tags)
               VALUES (:title, :priority, :created_at, :due_at, :done, :completed_at, :tags)""",
            row,
        )
        self.conn.commit()
        task.id = cursor.lastrowid
        return task

    def get(self, task_id: int) -> Task | None:
        row = self.conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        return Task.from_row(dict(row)) if row else None

    def all(self, include_done: bool = True) -> list[Task]:
        query = "SELECT * FROM tasks"
        if not include_done:
            query += " WHERE done = 0"
        rows = self.conn.execute(query).fetchall()
        return [Task.from_row(dict(r)) for r in rows]

    def update(self, task: Task) -> None:
        row = task.to_row()
        self.conn.execute(
            """UPDATE tasks SET title=:title, priority=:priority, created_at=:created_at,
               due_at=:due_at, done=:done, completed_at=:completed_at, tags=:tags
               WHERE id=:id""",
            row,
        )
        self.conn.commit()

    def delete(self, task_id: int) -> bool:
        cursor = self.conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        self.conn.commit()
        return cursor.rowcount > 0

    def close(self) -> None:
        self.conn.close()
