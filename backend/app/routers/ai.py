import logging
import os
import tempfile

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool
from sqlalchemy.ext.asyncio import AsyncSession

from .. import gigachat, models, permissions, reports, schemas, transcription
from ..database import get_db
from ..deps import get_current_user
from .export import gather_department_report_data, gather_employee_report_data

router = APIRouter(prefix="/ai", tags=["ai"])
logger = logging.getLogger("ai")

MAX_AUDIO_BYTES = 30 * 1024 * 1024

TRANSCRIBE_SYSTEM_PROMPT = (
    "Ты помогаешь руководителю оформить итоги PR-встречи (performance review) по "
    "автоматической расшифровке аудиозаписи. Расшифровка может содержать ошибки "
    "распознавания речи, слова-паразиты и незаконченные фразы — можешь поправить "
    "формулировку по смыслу, но СТРОГО ЗАПРЕЩЕНО добавлять любые факты, имена, даты, "
    "цифры, договорённости или выводы, которых нет в тексте расшифровки. Если фрагмент "
    "неразборчив, оборван или смысл непонятен — не додумывай и не сглаживай, а либо "
    "опусти его, либо оставь пометку «[неразборчиво]»; лучше пропустить деталь, чем "
    "предположить её. Не обобщай и не делай выводов о результатах, оценках или прогрессе "
    "сотрудника сверх того, что прямо сказано в тексте. Оформи результат как markdown-"
    "конспект с заголовками (###) и списками, структурированный по темам обсуждения; "
    "договорённости и следующие шаги вынеси отдельным пунктом, только если они явно "
    "прозвучали. Пиши только сам конспект, без вступлений, пояснений и оценок от себя."
)

SYSTEM_PROMPT = (
    "Ты — ассистент руководителя разработки, помогаешь анализировать развитие сотрудников "
    "по данным системы Performance Review. Отвечай на русском языке, кратко и по делу, "
    "структурируй ответ короткими абзацами или списком. Не выдумывай факты, которых нет "
    "во входных данных."
)


def _build_employee_prompt(data: dict) -> str:
    lines = [
        f"Сотрудник: {data['employee']['full_name']}",
        f"Направление: {data['employee']['direction']}",
        f"Подразделение: {data['employee']['department']}",
        f"Выполнение плана обучения: {data['stats']['completion_pct']}% "
        f"({data['stats']['confirmed']} из {data['stats']['total']} навыков подтверждено, "
        f"{data['stats']['problem']} просрочено)",
        "",
        "План обучения:",
    ]
    for item in data["plan_items"]:
        status_label = reports.STATUS_LABELS.get(item["status"], item["status"])
        line = f"- {item['skill']}: {status_label}, план {item['planned_date'].isoformat()}"
        if item["confirmed_date"]:
            line += f", подтверждён {item['confirmed_date'].isoformat()}"
        lines.append(line)

    lines.append("")
    lines.append(f"Проведено PR-встреч: {len(data['meetings'])}")
    for m in data["meetings"][:10]:
        lines.append(f"- {m['date'].isoformat()}: подтверждено навыков {m['confirmed_skills']}, проблем {m['problems']}")

    open_problems = [p for p in data["problems"] if not p["resolved"]]
    if open_problems:
        lines.append("")
        lines.append("Открытые проблемы:")
        for p in open_problems:
            lines.append(f"- {p['skill'] or 'Общее'}: {p['comment']}")

    lines.append("")
    lines.append(
        "На основе этих данных напиши: 1) краткую характеристику прогресса сотрудника, "
        "2) риски и на что стоит обратить внимание, 3) конкретные рекомендации руководителю "
        "для следующей PR-встречи."
    )
    return "\n".join(lines)


def _build_department_prompt(data: dict) -> str:
    lines = [
        f"Подразделение: {data['department']['path']}",
        f"Руководитель: {data['department']['manager'] or '—'}",
        f"Сотрудников: {data['stats']['people']}",
        f"Среднее выполнение плана обучения: {data['stats']['completion_pct']}%",
        f"Открытых проблем в команде: {data['stats']['open_problems']}",
        "",
        "По сотрудникам:",
    ]
    for e in data["employees"]:
        line = f"- {e['full_name']} ({e['direction']}): {e['confirmed']}/{e['total']} навыков, {e['completion_pct']}%"
        if e["open_problems"]:
            line += f", открытых проблем: {e['open_problems']}"
        lines.append(line)

    lines.append("")
    lines.append(
        "На основе этих данных напиши: 1) краткую сводку по состоянию команды, "
        "2) кто из сотрудников требует внимания и почему, 3) рекомендации руководителю "
        "подразделения по приоритетам на ближайший месяц."
    )
    return "\n".join(lines)


@router.post("/employees/{user_id}", response_model=schemas.AiAnalysisOut)
async def analyze_employee(user_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not gigachat.is_configured():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "GigaChat не настроен на сервере (GIGACHAT_AUTH_KEY)")
    data = await gather_employee_report_data(db, user_id, user)
    text = await gigachat.complete(SYSTEM_PROMPT, _build_employee_prompt(data))
    if text is None:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Не удалось получить ответ от GigaChat")
    return schemas.AiAnalysisOut(text=text)


@router.post("/departments/{dept_id}", response_model=schemas.AiAnalysisOut)
async def analyze_department(dept_id: str, db: AsyncSession = Depends(get_db), user: models.User = Depends(get_current_user)):
    if not gigachat.is_configured():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "GigaChat не настроен на сервере (GIGACHAT_AUTH_KEY)")
    data = await gather_department_report_data(db, dept_id, user)
    text = await gigachat.complete(SYSTEM_PROMPT, _build_department_prompt(data))
    if text is None:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Не удалось получить ответ от GigaChat")
    return schemas.AiAnalysisOut(text=text)


@router.post("/meetings/transcribe", response_model=schemas.TranscribeMeetingOut)
async def transcribe_meeting_audio(
    employee_id: str = Form(..., alias="employeeId"),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not await permissions.can_manage(db, user, employee_id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Недостаточно прав для этого сотрудника")
    if not gigachat.is_configured():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "GigaChat не настроен на сервере (GIGACHAT_AUTH_KEY)")

    contents = await audio.read()
    if not contents:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Пустой файл")
    if len(contents) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, f"Аудио слишком большое (максимум {MAX_AUDIO_BYTES // (1024 * 1024)} МБ)"
        )

    suffix = os.path.splitext(audio.filename or "")[1] or ".audio"
    with tempfile.NamedTemporaryFile(suffix=suffix) as tmp:
        tmp.write(contents)
        tmp.flush()
        try:
            # CPU-bound and can take a while on a small server — never run this
            # directly in an async def, it would freeze every other request.
            raw_text = await run_in_threadpool(transcription.transcribe, tmp.name)
        except Exception:
            logger.exception("Whisper transcription failed")
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Не удалось распознать аудио")

    if not raw_text:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "В аудио не распознано речи")

    # Low temperature on purpose: this is transcription clean-up, not creative
    # writing — the lower the temperature, the less the model tends to fill
    # gaps with plausible-sounding but invented detail.
    structured = await gigachat.complete(TRANSCRIBE_SYSTEM_PROMPT, raw_text, temperature=0.15)
    if structured is None:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Не удалось получить ответ от GigaChat")

    return schemas.TranscribeMeetingOut(transcript=raw_text, summary_markdown=structured)
