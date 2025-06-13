from typing import List, Dict
import fitz  # PyMuPDF

def extract_text_items(pdf_bytes: bytes) -> List[Dict]:
    """
    Extract text spans with style, position, and width information from the first PDF page.

    Each item returned:
    {
        "text": str,
        "original_text": str,
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
                text_value = span["text"]
                items.append({
                    "text": text_value,
                    "original_text": text_value,  
                    "x": x0,
                    "y": page.rect.height - y1,   
                    "font_size": span["size"],
                    "width": x1 - x0,             
                    "font_name": font_name,
                    "is_bold": "Bold" in font_name,
                    "is_italic": any(tag in font_name for tag in ["Italic", "Oblique"]),
                })

    doc.close()
    return items



def replace_text_and_generate(pdf_bytes: bytes, edits: List[Dict]) -> bytes:
    """
    For each edit: {
        text: str,
        original_text: str,
        x: float,
        y: float (top-left origin),
        font_size: float,
        width: float,
        font_name: str,
        is_bold: bool,
        is_italic: bool
    }

    Only modifies the text if it was edited.
    Masks original text with white box and inserts the new text in the same place.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]

    for edit in edits:
        if edit["text"] == edit.get("original_text"):
            continue  # 

        # Convert y from top-left to bottom-left origin
        y_bottom_left = page.rect.height - edit["y"]

        # Estimate rectangle to mask original text
        rect = fitz.Rect(
            edit["x"] - 1,
            y_bottom_left - edit["font_size"] - 1,
            edit["x"] + edit.get("width", edit["font_size"] * len(edit["text"])) + 1,
            y_bottom_left + 1
        )
        page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))  # white mask

        # Determine font style (bold/italic)
        font_flags = 0
        if edit.get("is_bold"):
            font_flags |= fitz.TEXTFLAGS_BOLD
        if edit.get("is_italic"):
            font_flags |= fitz.TEXTFLAGS_ITALIC

        # Insert new text
        page.insert_text(
            (edit["x"], y_bottom_left),
            edit["text"],
            fontsize=edit["font_size"],
            fontname="helv",  
            color=(0, 0, 0),
            render_mode=0,  
            overlay=True,
        )

    new_pdf = doc.write()
    doc.close()
    return new_pdf
