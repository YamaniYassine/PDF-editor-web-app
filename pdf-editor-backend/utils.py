from typing import List, Dict
import fitz  # PyMuPDF

def extract_text_items(pdf_bytes: bytes) -> List[Dict]:

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
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page = doc[0]

    for edit in edits:
        if edit["text"] == edit.get("original_text"):
            continue

        y_bottom_left = page.rect.height - edit["y"]
        
        
        padding_x = 0.1  # horizontal padding
        padding_y = 0.1  # vertical padding

        #mask  to hide the original text
        rect = fitz.Rect(
            edit["x"] - padding_x,
            y_bottom_left - edit["font_size"] - padding_y,
            edit["x"] + edit.get("width", edit["font_size"] * len(edit["text"])) + padding_x,
            y_bottom_left + padding_y
        )

        page.draw_rect(rect, color=(1, 1, 1), fill=(1, 1, 1))

        baseline_adjustment = 0.2 * edit["font_size"]

        page.insert_text(
            (edit["x"], y_bottom_left - baseline_adjustment),
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

