"""Seed the database only when it is empty (safe deploy hook).

Runs `generate_synthetic_data.main()` iff `recovery_cases` has zero rows.
Usage (also used as Render preDeploy step after `alembic upgrade head`):
    python scripts/seed_if_empty.py
"""

import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text

from app.db.session import async_session


async def _case_count() -> int:
    async with async_session() as session:
        res = await session.execute(text("SELECT COUNT(*) FROM recovery_cases"))
        return int(res.scalar() or 0)


async def main() -> None:
    try:
        count = await _case_count()
    except Exception as exc:
        print(f"[!] Could not read recovery_cases (migrations pending?): {exc}")
        raise SystemExit(1)
    if count > 0:
        print(f"[*] Database already seeded ({count} cases). Skipping.")
        return
    print("[*] Empty database detected. Seeding synthetic dataset...")
    try:
        from scripts.generate_synthetic_data import main as seed_main
    except ImportError:
        from generate_synthetic_data import main as seed_main  # noqa: E402

    await seed_main()


if __name__ == "__main__":
    asyncio.run(main())
