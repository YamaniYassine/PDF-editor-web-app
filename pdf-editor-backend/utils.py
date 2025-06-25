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
                        "page_number": page_number
                    })

    doc.close()
    return items


def replace_text_and_generate(pdf_bytes: bytes, edits: List[Dict]) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for edit in edits:
        if edit["text"] == edit.get("original_text"):
            continue

        page_number = edit.get("page_number", 0)
        if page_number < 0 or page_number >= len(doc):
            continue  # Skip invalid page references

        page = doc[page_number]
        y_bottom_left = page.rect.height - edit["y"]

        padding_x = 0.1
        padding_y = 0.1

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