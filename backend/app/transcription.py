import logging

from faster_whisper import WhisperModel

from .config import settings

logger = logging.getLogger("transcription")

_model: WhisperModel | None = None


def _get_model() -> WhisperModel:
    global _model
    if _model is None:
        logger.info("Loading Whisper model '%s' (int8, CPU) — first use only", settings.whisper_model_size)
        _model = WhisperModel(settings.whisper_model_size, device="cpu", compute_type="int8")
    return _model


def transcribe(audio_path: str) -> str:
    """Blocking, CPU-bound — callers must run this in a thread, never directly in an async def."""
    model = _get_model()
    segments, _info = model.transcribe(audio_path, language=settings.whisper_language, vad_filter=True)
    return " ".join(segment.text.strip() for segment in segments).strip()
