from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import IntEnum


class Priority(IntEnum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3

    @classmethod
    def from_str(cls, value: str) -> "Priority":
        mapping = {"low": cls.LOW, "medium": cls.MEDIUM, "high": cls.HIGH}
        key = value.strip().lower()
        if key not in mapping:
            raise ValueError(f"unknown priority '{value}', expected low/medium/high")
        return mapping[key]

    def label(self) -> str:
        return self.name.capitalize()


DECAY_HALF_LIFE_HOURS = {
    Priority.HIGH: 6,
    Priority.MEDIUM: 24,
    Priority.LOW: 72,
}


@dataclass
class Task:
    id: int
    title: str
    priority: Priority
    created_at: datetime
    due_at: datetime | None = None
    done: bool = False
    completed_at: datetime | None = None
    tags: list[str] = field(default_factory=list)

    def urgency(self, now: datetime | None = None) -> float:
        """Urgency climbs the longer a task sits untouched, faster for
        high-priority tasks. Overdue tasks get a hard boost on top."""
        now = now or datetime.now()
        if self.done:
            return -1.0

        age_hours = max((now - self.created_at).total_seconds() / 3600, 0)
        half_life = DECAY_HALF_LIFE_HOURS[self.priority]
        base = int(self.priority) * (1 - 0.5 ** (age_hours / half_life))
        score = int(self.priority) + base

        if self.due_at and now > self.due_at:
            overdue_hours = (now - self.due_at).total_seconds() / 3600
            score += min(overdue_hours * 0.5, 10)

        return round(score, 2)

    def status_glyph(self) -> str:
        if self.done:
            return "x"
        if self.due_at and datetime.now() > self.due_at:
            return "!"
        return " "

    def to_row(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "priority": self.priority.value,
            "created_at": self.created_at.isoformat(),
            "due_at": self.due_at.isoformat() if self.due_at else None,
            "done": int(self.done),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "tags": ",".join(self.tags),
        }

    @staticmethod
    def from_row(row: dict) -> "Task":
        return Task(
            id=row["id"],
            title=row["title"],
            priority=Priority(row["priority"]),
            created_at=datetime.fromisoformat(row["created_at"]),
            due_at=datetime.fromisoformat(row["due_at"]) if row["due_at"] else None,
            done=bool(row["done"]),
            completed_at=datetime.fromisoformat(row["completed_at"]) if row["completed_at"] else None,
            tags=row["tags"].split(",") if row["tags"] else [],
          )
      
