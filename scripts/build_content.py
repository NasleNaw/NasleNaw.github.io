from datetime import date, datetime
from pathlib import Path
import json
import re
import sys

import yaml


# مسیر اصلی مخزن GitHub
ROOT = Path(__file__).resolve().parents[1]

# مسیر فایل خروجی
OUTPUT = ROOT / "assets" / "data" / "site-content.json"


# تبدیل تاریخ به فرمت استاندارد
def to_iso(value):
    if isinstance(value, datetime):
        return value.date().isoformat()

    if isinstance(value, date):
        return value.isoformat()

    return str(value or "")


# حذف تگ‌ها و نشانه‌های Markdown
def strip_markdown(value):
    text = str(value or "")

    text = re.sub(r"```.*?```", " ", text, flags=re.S)
    text = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    text = re.sub(r"[*_`>#~]", "", text)
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# خواندن هر خبر یا اطلاعیه
def read_post(path, kind):

    raw = path.read_text(encoding="utf-8-sig")

    if not raw.startswith("---"):
        return None

    parts = raw.split("---", 2)

    if len(parts) < 3:
        return None

    metadata = yaml.safe_load(parts[1]) or {}

    if not isinstance(metadata, dict):
        return None

    # فقط مطالب منتشرشده
    if metadata.get("published") is not True:
        return None

    body = parts[2].strip()

    # دریافت خلاصه یا استخراج از متن اصلی
    summary = metadata.get("summary")

    if not summary:
        summary = metadata.get("body") or body

    summary = strip_markdown(summary)

    return {
        "category": str(
    metadata.get("category") or ""
).strip(),

"importance": str(
    metadata.get("importance") or "عادی"
).strip(),

"link": str(
    metadata.get("link") or ""
).strip(),
        "type": kind,

        "title": str(
            metadata.get("title") or ""
        ).strip(),

        "date": to_iso(
            metadata.get("date")
        ),

        "summary": summary,

        "image": str(
            metadata.get("image") or ""
        ).strip(),

        "priority": str(
            metadata.get("priority") or "normal"
        ),

        "published": True,

        "body": str(
            metadata.get("body") or body
        ) if kind == "news" else "",

        "source": path.relative_to(ROOT).as_posix()
    }


# ساخت فایل JSON
def main():

    items = []

    collections = [
        (
            ROOT / "content" / "news",
            "news"
        ),
        (
            ROOT / "content" / "announcements",
            "announcement"
        )
    ]

    for folder, kind in collections:

        if not folder.exists():
            continue

        for path in folder.glob("*.md"):

            try:
                item = read_post(path, kind)

                if item and item["title"]:
                    items.append(item)

            except Exception as error:

                print(
                    f"خطا در خواندن {path}: {error}",
                    file=sys.stderr
                )

    # مرتب‌سازی از جدیدترین به قدیمی‌ترین
    items.sort(
        key=lambda item: item["date"],
        reverse=True
    )

    # ایجاد پوشه خروجی
    OUTPUT.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    # ذخیره اطلاعات
    OUTPUT.write_text(
        json.dumps(
            {"items": items},
            ensure_ascii=False,
            indent=2
        ) + "\n",
        encoding="utf-8"
    )

    print(
        f"Successfully generated {len(items)} published posts."
    )


if __name__ == "__main__":
    main()
