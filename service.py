from datetime import datetime, timedelta

from .models import Priority, Task
from .storage import TaskStore


class TaskService:
    def __init__(self, store: TaskStore):
        self.store = store

    def create_task(
        self,
        title: str,
        priority: str = "medium",
        due_in_hours: float | None = None,
        tags: list[str] | None = None,
    ) -> Task:
        now = datetime.now()
        due_at = now + timedelta(hours=due_in_hours) if due_in_hours else None
        task = Task(
            id=0,
            title=title.strip(),
            priority=Priority.from_str(priority),
            created_at=now,
            due_at=due_at,
            tags=tags or [],
        )
        return self.store.add(task)

    def complete_task(self, task_id: int) -> Task:
        task = self._require(task_id)
        task.done = True
        task.completed_at = datetime.now()
        self.store.update(task)
        return task

    def reopen_task(self, task_id: int) -> Task:
        task = self._require(task_id)
        task.done = False
        task.completed_at = None
        self.store.update(task)
        return task

    def delete_task(self, task_id: int) -> None:
        if not self.store.delete(task_id):
            raise KeyError(f"no task with id {task_id}")

    def ranked_open_tasks(self) -> list[Task]:
        tasks = self.store.all(include_done=False)
        return sorted(tasks, key=lambda t: t.urgency(), reverse=True)

    def all_tasks(self) -> list[Task]:
        return self.store.all(include_done=True)

    def _require(self, task_id: int) -> Task:
        task = self.store.get(task_id)
        if task is None:
            raise KeyError(f"no task with id {task_id}")
        return task
      
