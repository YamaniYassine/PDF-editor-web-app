from typing import List, Dict
import fitz  # PyMuPDF

def extract_text_items(pdf_bytes: bytes) -> List[Dict]:
    """
    Extract text spans with style, position, and width information from the first PDF page.

    Each item returned:
    {
        "text": str,
        "x": float,
        "y": float,                # Transformed to top-left origin
        "font_size": float,
        "width": float,
        "font_name": str,
        "is_bold": bool,
        "is_italic": bool
    }
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]
    items = []

    for block in page.get_text("dict")["blocks"]:
        for line in block.get("lines", []):
            for span in line.get("spans", []):
                x0, y0, x1, y1 = span["bbox"]
                font_name = span.get("font", "")
                items.append({
                    "text": span["text"],
                    "x": x0,
                    "y": page.rect.height - y1,  # Convert to top-left origin
                    "font_size": span["size"],
                    "width": x1 - x0,            # Width estimation from bounding box
                    "font_name": font_name,
                    "is_bold": "Bold" in font_name,
                    "is_italic": any(tag in font_name for tag in ["Italic", "Oblique"]),
                })

    doc.close()
    return items


def replace_text_and_generate(pdf_bytes: bytes, edits: List[Dict]) -> bytes:
    """
    For each edit: { text, x, y, font_size }
    Optionally mask old text by drawing a filled rectangle.
    Insert new text at same position.
    Returns new PDF bytes.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]

    # Optional: mask original text areas
    for edit in edits:
        rect = fitz.Rect(
            edit["x"] - 1,
            (page.rect.height - edit["y"]) - edit["font_size"] - 1,
            edit["x"] + edit.get("width", edit["font_size"] * len(edit["text"])) + 1,
            (page.rect.height - edit["y"]) + 1
        )
        page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))

    # Insert new text spans
    for edit in edits:
        page.insert_text(
            (edit["x"], page.rect.height - edit["y"]),
            edit["text"],
            fontsize=edit["font_size"],
            color=(0, 0, 0),
        )

    new_pdf = doc.write()
    doc.close()
    return new_pdf