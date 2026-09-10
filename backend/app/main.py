import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import auth, departments, directions, meetings, plans, skills, users
from .scheduler import start_scheduler
from .seed import seed_if_empty

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with SessionLocal() as db:
        await seed_if_empty(db)

    scheduler = start_scheduler()
    try:
        yield
    finally:
        scheduler.shutdown(wait=False)


app = FastAPI(title="Performance Review API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(directions.router)
app.include_router(skills.router)
app.include_router(plans.router)
app.include_router(meetings.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
