from pathlib import Path
# backend/app/core/paths.py
# 当前文件位置：backend/app/core/paths.py
# parents[0] = core
# parents[1] = app
# parents[2] = backend
BASE_DIR = Path(__file__).resolve().parents[2]

DATA_DIR = BASE_DIR / "data"