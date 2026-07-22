from typing import List, Dict
import fitz  # PyMuPDF
import io
import subprocess
import tempfile


def extract_text_items(pdf_bytes: bytes) -> List[Dict]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    items = []

    for page_number, page in enumerate(doc):
        for block in page.get_text("dict")["blocks"]:
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    x0, y0, x1, y1 = span["bbox"]
                    font_name = span.get("font", "")
                    text_value = span["text"]
                    color_value = span.get("color", 0)
                    items.append({
                        "text": text_value,
                        "original_text": text_value,
                        "x": x0,
                        # PyMuPDF and PDF.js both use a top-left origin for their
                        # rendered coordinates. Keeping the original bounding box
                        # avoids the former double coordinate conversion.
                        "y": y0,
                        "font_size": span["size"],
                        "width": x1 - x0,
                        "height": y1 - y0,
                        "baseline": span.get("origin", (x0, y1))[1],
                        "font_name": font_name,
                        "is_bold": "Bold" in font_name,
                        "is_italic": any(tag in font_name for tag in ["Italic", "Oblique"]),
                        "color": [
                            ((color_value >> 16) & 255) / 255,
                            ((color_value >> 8) & 255) / 255,
                            (color_value & 255) / 255,
                        ],
                        "page_number": page_number
                    })

    doc.close()
    return items


def _fallback_font(edit: Dict) -> str:
    """Map common extracted font families to one of PyMuPDF's built-in fonts."""
    family = edit.get("font_name", "").lower()
    bold = edit.get("is_bold", False)
    italic = edit.get("is_italic", False)

    if "courier" in family:
        return "cobi" if bold and italic else "cobo" if bold else "coit" if italic else "cour"
    if "times" in family or "serif" in family:
        return "tibi" if bold and italic else "tibo" if bold else "tiit" if italic else "tiro"
    return "hebi" if bold and italic else "hebo" if bold else "heit" if italic else "helv"


def replace_text_and_generate(pdf_bytes: bytes, edits: List[Dict]) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for edit in edits:
        if edit["text"] == edit.get("original_text"):
            continue

        page_number = edit.get("page_number", 0)
        if page_number < 0 or page_number >= len(doc):
            continue  # Skip invalid page references

        page = doc[page_number]
        padding_x = 0.1
        padding_y = 0.1

        rect = fitz.Rect(
            edit["x"] - padding_x,
            edit["y"] - padding_y,
            edit["x"] + edit.get("width", edit["font_size"] * len(edit["text"])) + padding_x,
            edit["y"] + edit.get("height", edit["font_size"] * 1.3) + padding_y,
        )

        # Redaction removes the original characters from the PDF text layer.
        # Drawing a white rectangle only hides them visually and leaves stale
        # text behind when a user searches or copies from the saved PDF.
        page.add_redact_annot(rect, fill=(1, 1, 1))
        page.apply_redactions()

        color = edit.get("color", (0, 0, 0))
        if not isinstance(color, (list, tuple)) or len(color) != 3:
            color = (0, 0, 0)

        page.insert_text(
            (edit["x"], edit.get("baseline", edit["y"] + edit["font_size"])),
            edit["text"],
            fontsize=edit["font_size"],
            fontname=_fallback_font(edit),
            color=color,
            render_mode=0,
            overlay=True,
        )

    new_pdf = doc.write()
    doc.close()
    return new_pdf

def merge_pdfs_bytes(files: List[bytes]) -> bytes:
    merged_pdf = fitz.open()

    for file_bytes in files:
        pdf = fitz.open(stream=file_bytes, filetype="pdf")
        merged_pdf.insert_pdf(pdf)
        pdf.close()

    output_stream = io.BytesIO()
    merged_pdf.save(output_stream)
    merged_pdf.close()
    return output_stream.getvalue()

def delete_pages_from_pdf(pdf_bytes: bytes, pages_to_delete: List[int]) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for index in sorted(pages_to_delete, reverse=True):
        if 0 <= index < len(doc):
            doc.delete_page(index)

    output_stream = io.BytesIO()
    doc.save(output_stream)
    doc.close()
    return output_stream.getvalue()


def compress_pdf_with_qpdf(pdf_bytes: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as input_file, \
         tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as output_file:

        input_file.write(pdf_bytes)
        input_file.flush()

        # Run qpdf with compression options
        subprocess.run([
            "qpdf",
            "--object-streams=generate",
            "--stream-data=compress",
            "--linearize",
            input_file.name,
            output_file.name
        ], check=True)

        # Read compressed result
        with open(output_file.name, 'rb') as f:
            return f.read()
