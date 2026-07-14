from .models import Task

URGENCY_BARS = " ▁▂▃▄▅▆▇█"


def urgency_bar(score: float, max_score: float = 13.0) -> str:
    ratio = min(max(score / max_score, 0), 1)
    index = round(ratio * (len(URGENCY_BARS) - 1))
    return URGENCY_BARS[index] * 3


def format_task_line(task: Task) -> str:
    glyph = task.status_glyph()
    bar = urgency_bar(task.urgency()) if not task.done else "done"
    due_str = task.due_at.strftime("%b %d %H:%M") if task.due_at else "no deadline"
    tag_str = f" [{', '.join(task.tags)}]" if task.tags else ""
    return f"[{glyph}] #{task.id:<3} {bar:<4} {task.title}{tag_str}  ({task.priority.label()}, due {due_str})"


def render_list(tasks: list[Task], heading: str) -> str:
    if not tasks:
        return f"{heading}\n  nothing here."
    lines = [heading]
    for task in tasks:
        lines.append("  " + format_task_line(task))
    return "\n".join(lines)
  
