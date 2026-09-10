import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .. import max_notify, models, schemas
from ..database import get_db
from ..deps import get_current_user, require_admin
from ..errors import translate_integrity_error
from ..ids import new_id
from ..security import hash_password

router = APIRouter(prefix="/users", tags=["users"])

AVATAR_PALETTE = ["#6366f1", "#0ea5e9", "#22c55e", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6"]


@router.get("", response_model=list[schemas.UserOut])
async def list_users(db: AsyncSession = Depends(get_db), _user: models.User = Depends(get_current_user)):
    result = await db.execute(select(models.User))
    return result.scalars().all()


@router.patch("/me/notifications", response_model=schemas.UserOut)
async def update_my_notifications(
    payload: schemas.NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    user.max_chat_id = payload.max_chat_id or None
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/me/notifications/test")
async def send_test_notification(user: models.User = Depends(get_current_user)):
    if not max_notify.is_configured():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "MAX_BOT_TOKEN не настроен на сервере")
    if not user.max_chat_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Сначала укажите chat id в настройках уведомлений")
    ok = await max_notify.send_message(
        user.max_chat_id, f"Привет, {user.full_name.split()[0]}! Это тестовое уведомление из Performance Review."
    )
    if not ok:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Не удалось отправить сообщение в MAX")
    return {"sent": True}


@router.get("/{user_id}", response_model=schemas.UserOut)
async def get_user(
    user_id: str, db: AsyncSession = Depends(get_db), _user: models.User = Depends(get_current_user)
):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    return user


async def _ensure_login_free(db: AsyncSession, login: str, exclude_id: str | None = None) -> None:
    result = await db.execute(select(models.User).where(models.User.login == login))
    existing = result.scalar_one_or_none()
    if existing and existing.id != exclude_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "Логин уже занят")


@router.post("", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    payload: schemas.UserCreate, db: AsyncSession = Depends(get_db), _admin: models.User = Depends(require_admin)
):
    await _ensure_login_free(db, payload.login)
    count = (await db.execute(select(models.User))).scalars().all()
    user = models.User(
        id=new_id("user"),
        full_name=payload.full_name,
        login=payload.login,
        password_hash=hash_password(payload.password),
        direction_id=payload.direction_id,
        department_id=payload.department_id,
        is_admin=payload.is_admin,
        avatar_color=AVATAR_PALETTE[len(count) % len(AVATAR_PALETTE)],
        created_at=datetime.date.today(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=schemas.UserOut)
async def update_user(
    user_id: str,
    payload: schemas.UserUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: models.User = Depends(require_admin),
):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    data = payload.model_dump(exclude_unset=True)
    if "login" in data and data["login"]:
        await _ensure_login_free(db, data["login"], exclude_id=user_id)
    if data.get("password"):
        user.password_hash = hash_password(data.pop("password"))
    else:
        data.pop("password", None)
    for field, value in data.items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str, db: AsyncSession = Depends(get_db), _admin: models.User = Depends(require_admin)
):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Пользователь не найден")
    async with translate_integrity_error(
        db, "Пользователь проводил встречи, сохранённые в системе — его нельзя удалить"
    ):
        await db.delete(user)
        await db.commit()
