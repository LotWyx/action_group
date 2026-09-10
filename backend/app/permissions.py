"""Tree-relative authorization: mirrors src/composables/usePermissions.ts.

Access is never a fixed role on a user — it is derived from where the viewer
sits in the department tree relative to the profile being acted on. The same
person can manage their subordinates' PR while being a subordinate themselves
in their own manager's PR, so every check here is a function of
(viewer, target), never a static role flag.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from . import models


async def _department_map(db: AsyncSession) -> dict[str, models.Department]:
    result = await db.execute(select(models.Department))
    return {d.id: d for d in result.scalars().all()}


def _ancestor_chain(dept_id: str | None, depts: dict[str, models.Department]) -> list[str]:
    chain: list[str] = []
    current = depts.get(dept_id).parent_id if dept_id in depts else None
    while current:
        chain.append(current)
        current = depts.get(current).parent_id if current in depts else None
    return chain


async def manages_employee(db: AsyncSession, manager_id: str, target: models.User) -> bool:
    if not target.department_id:
        return False
    depts = await _department_map(db)
    chain = [target.department_id, *_ancestor_chain(target.department_id, depts)]
    return any(depts[d].manager_id == manager_id for d in chain if d in depts)


async def can_view(db: AsyncSession, viewer: models.User, target_id: str) -> bool:
    if viewer.is_admin:
        return True
    if viewer.id == target_id:
        return True
    target = await db.get(models.User, target_id)
    if not target:
        return False
    return await manages_employee(db, viewer.id, target)


async def can_manage(db: AsyncSession, viewer: models.User, target_id: str) -> bool:
    if viewer.is_admin:
        return True
    target = await db.get(models.User, target_id)
    if not target:
        return False
    return await manages_employee(db, viewer.id, target)
