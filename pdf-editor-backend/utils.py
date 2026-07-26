from typing import List, Dict, Optional, Tuple
from collections import Counter
import fitz  # PyMuPDF
import io
import subprocess
import tempfile
import re
import os


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
                        "edit_mode": "content" if _page_supports_content_replacement(page, text_value) else "fallback",
                        "page_number": page_number
                    })

    doc.close()
    return items


def _decode_pdf_literal(value: bytes) -> bytes:
    """Decode the bytes inside a PDF literal string (without its parentheses)."""
    output = bytearray()
    index = 0
    escapes = {ord("n"): 10, ord("r"): 13, ord("t"): 9, ord("b"): 8, ord("f"): 12}

    while index < len(value):
        char = value[index]
        if char != ord("\\"):
            output.append(char)
            index += 1
            continue

        index += 1
        if index >= len(value):
            break
        char = value[index]
        if char in (10, 13):  # line continuation
            if char == 13 and index + 1 < len(value) and value[index + 1] == 10:
                index += 1
        elif ord("0") <= char <= ord("7"):
            digits = [char]
            while len(digits) < 3 and index + 1 < len(value) and ord("0") <= value[index + 1] <= ord("7"):
                index += 1
                digits.append(value[index])
            output.append(int(bytes(digits), 8))
        else:
            output.append(escapes.get(char, char))
        index += 1

    return bytes(output)


def _encode_pdf_literal(value: str) -> Optional[bytes]:
    """Encode ordinary WinAnsi text safely for a PDF literal string."""
    try:
        raw = value.encode("cp1252")
    except UnicodeEncodeError:
        return None

    encoded = bytearray()
    for char in raw:
        if char in (ord("("), ord(")"), ord("\\")):
            encoded.extend(b"\\" + bytes([char]))
        elif 32 <= char <= 126:
            encoded.append(char)
        else:
            encoded.extend(f"\\{char:03o}".encode("ascii"))
    return bytes(encoded)


def _find_literal_tj(content: bytes, text: str) -> Optional[Tuple[int, int]]:
    """Find an exact `(text) Tj` operand, respecting escaped/nested parentheses."""
    try:
        target = text.encode("cp1252")
    except UnicodeEncodeError:
        return None

    index = 0
    while index < len(content):
        if content[index] != ord("("):
            index += 1
            continue

        start = index
        index += 1
        depth = 1
        escaped = False
        while index < len(content) and depth:
            char = content[index]
            if escaped:
                escaped = False
            elif char == ord("\\"):
                escaped = True
            elif char == ord("("):
                depth += 1
            elif char == ord(")"):
                depth -= 1
            index += 1

        if depth:
            return None
        end = index
        if _decode_pdf_literal(content[start + 1:end - 1]) != target:
            continue

        operator_start = end
        while operator_start < len(content) and content[operator_start] in b" \t\r\n\f\0":
            operator_start += 1
        if content[operator_start:operator_start + 2] == b"Tj":
            return start, end
    return None


def _find_hex_tj(content: bytes, text: str) -> Optional[Tuple[int, int]]:
    """Find an exact `<text>` operand used by either `Tj` or `TJ`."""
    try:
        target = text.encode("cp1252")
    except UnicodeEncodeError:
        return None

    index = 0
    while index < len(content):
        if content[index] != ord("<") or (index + 1 < len(content) and content[index + 1] == ord("<")):
            index += 1
            continue
        end = content.find(b">", index + 1)
        if end == -1:
            return None
        raw_hex = content[index + 1:end].replace(b" ", b"").replace(b"\n", b"")
        try:
            decoded = bytes.fromhex(raw_hex.decode("ascii"))
        except ValueError:
            index = end + 1
            continue
        if decoded != target:
            index = end + 1
            continue

        operator_start = end + 1
        while operator_start < len(content) and content[operator_start] in b" \t\r\n\f\0":
            operator_start += 1
        if content[operator_start:operator_start + 2] == b"Tj":
            return index, end + 1

        array_end = content.find(b"]", end + 1)
        if array_end != -1:
            operator_start = array_end + 1
            while operator_start < len(content) and content[operator_start] in b" \t\r\n\f\0":
                operator_start += 1
            if content[operator_start:operator_start + 2] == b"TJ":
                return index, end + 1
        index = end + 1
    return None


def _find_text_array_tj(content: bytes, text: str) -> Optional[Tuple[int, int]]:
    """Find a `TJ` array whose string fragments combine into the extracted text."""
    try:
        target = text.encode("cp1252")
    except UnicodeEncodeError:
        return None

    index = 0
    while index < len(content):
        if content[index] != ord("["):
            index += 1
            continue

        array_start = index
        index += 1
        fragments = bytearray()
        valid_array = True
        while index < len(content) and content[index] != ord("]"):
            if content[index] in b" \t\r\n\f\0+-0123456789.":
                index += 1
                continue
            if content[index] == ord("("):
                start = index
                index += 1
                depth = 1
                escaped = False
                while index < len(content) and depth:
                    char = content[index]
                    if escaped:
                        escaped = False
                    elif char == ord("\\"):
                        escaped = True
                    elif char == ord("("):
                        depth += 1
                    elif char == ord(")"):
                        depth -= 1
                    index += 1
                if depth:
                    valid_array = False
                    break
                fragments.extend(_decode_pdf_literal(content[start + 1:index - 1]))
                continue
            if content[index] == ord("<") and not (index + 1 < len(content) and content[index + 1] == ord("<")):
                end = content.find(b">", index + 1)
                if end == -1:
                    valid_array = False
                    break
                try:
                    fragments.extend(bytes.fromhex(content[index + 1:end].replace(b" ", b"").replace(b"\n", b"").decode("ascii")))
                except ValueError:
                    valid_array = False
                    break
                index = end + 1
                continue
            valid_array = False
            break

        if index >= len(content) or content[index] != ord("]"):
            index = array_start + 1
            continue
        array_end = index
        operator_start = array_end + 1
        while operator_start < len(content) and content[operator_start] in b" \t\r\n\f\0":
            operator_start += 1
        if valid_array and content[operator_start:operator_start + 2] == b"TJ" and bytes(fragments) == target:
            return array_start + 1, array_end
        index = array_end + 1
    return None


def _text_show_operands(content: bytes) -> List[Tuple[int, int, bytes, bool]]:
    """Return literal / hex string operands immediately followed by the `Tj` operator."""
    operands = []
    index = 0
    while index < len(content):
        start = index
        decoded = None
        is_hex = False

        if content[index] == ord("("):
            index += 1
            value_start = index
            depth = 1
            escaped = False
            while index < len(content) and depth:
                char = content[index]
                if escaped:
                    escaped = False
                elif char == ord("\\"):
                    escaped = True
                elif char == ord("("):
                    depth += 1
                elif char == ord(")"):
                    depth -= 1
                index += 1
            if depth:
                break
            decoded = _decode_pdf_literal(content[value_start:index - 1])
        elif content[index] == ord("<") and not (index + 1 < len(content) and content[index + 1] == ord("<")):
            end = content.find(b">", index + 1)
            if end == -1:
                break
            try:
                decoded = bytes.fromhex(content[index + 1:end].replace(b" ", b"").replace(b"\n", b"").decode("ascii"))
            except ValueError:
                index = end + 1
                continue
            index = end + 1
            is_hex = True
        else:
            index += 1
            continue

        operator_start = index
        while operator_start < len(content) and content[operator_start] in b" \t\r\n\f\0":
            operator_start += 1
        if content[operator_start:operator_start + 2] == b"Tj":
            operands.append((start, index, decoded, is_hex))
    return operands


def _find_fragmented_tj(content: bytes, text: str) -> Optional[List[Tuple[int, int, bytes, bool]]]:
    """Find text split over several `Tj` calls separated only by text positioning."""
    try:
        target = text.encode("cp1252")
    except UnicodeEncodeError:
        return None

    operands = _text_show_operands(content)
    for start_index, first in enumerate(operands):
        combined = first[2]
        if not target.startswith(combined):
            continue
        selected = [first]
        if combined == target:
            return selected
        for candidate in operands[start_index + 1:]:
            between = content[selected[-1][1]:candidate[0]]
            # Allow only whitespace, numeric offsets and text-positioning/show
            # operators. Encountering drawing or font commands ends the run.
            if not re.fullmatch(rb"[\s0-9+\-.TjdD*]*", between):
                break
            combined += candidate[2]
            if not target.startswith(combined):
                break
            selected.append(candidate)
            if combined == target:
                return selected
    return None


def _page_supports_content_replacement(page: fitz.Page, text: str) -> bool:
    """Return whether a text span has a known safe content-stream representation."""
    document = page.parent
    for xref in page.get_contents():
        stream = document.xref_stream(xref)
        if (
            _find_literal_tj(stream, text) is not None
            or _find_hex_tj(stream, text) is not None
            or _find_text_array_tj(stream, text) is not None
            or _find_fragmented_tj(stream, text) is not None
        ):
            return True
    return False


def _fallback_font(edit: Dict) -> str:
    family = edit.get("font_name", "").lower()
    bold = edit.get("is_bold", False)
    italic = edit.get("is_italic", False)
    if "courier" in family:
        return "cobi" if bold and italic else "cobo" if bold else "coit" if italic else "cour"
    if "times" in family or "serif" in family:
        return "tibi" if bold and italic else "tibo" if bold else "tiit" if italic else "tiro"
    return "hebi" if bold and italic else "hebo" if bold else "heit" if italic else "helv"


def _background_color(page: fitz.Page, rect: fitz.Rect) -> Tuple[float, float, float]:
    """Estimate the local background from rendered pixels around a text span."""
    scale = 2
    pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
    expanded = fitz.Rect(rect.x0 - 2, rect.y0 - 2, rect.x1 + 2, rect.y1 + 2) & page.rect
    x0, y0, x1, y1 = (int(value * scale) for value in (expanded.x0, expanded.y0, expanded.x1, expanded.y1))
    samples = pixmap.samples
    colors = []
    step = max(1, min(x1 - x0, y1 - y0) // 16)
    for y in range(max(0, y0), min(pixmap.height, y1), step):
        for x in range(max(0, x0), min(pixmap.width, x1), step):
            offset = (y * pixmap.width + x) * pixmap.n
            colors.append(tuple(samples[offset + channel] // 8 for channel in range(3)))
    if not colors:
        return (1, 1, 1)
    red, green, blue = Counter(colors).most_common(1)[0][0]
    return ((red * 8 + 4) / 255, (green * 8 + 4) / 255, (blue * 8 + 4) / 255)


def _replace_text_with_background_match(page: fitz.Page, edit: Dict) -> None:
    """Visual fallback for unsupported text streams; preserves the local page colour."""
    rect = fitz.Rect(
        edit["x"] - 0.5,
        edit["y"] - 0.5,
        edit["x"] + edit.get("width", edit["font_size"] * len(edit["text"])) - 0.25,
        edit["y"] + edit.get("height", edit["font_size"] * 1.3) - 0.25,
    )
    page.draw_rect(rect, color=None, fill=_background_color(page, rect), overlay=True)
    color = edit.get("color", (0, 0, 0))
    if not isinstance(color, (list, tuple)) or len(color) != 3:
        color = (0, 0, 0)
    page.insert_text(
        (edit["x"], edit.get("baseline", edit["y"] + edit["font_size"])),
        edit["text"],
        fontsize=edit["font_size"],
        fontname=_fallback_font(edit),
        color=color,
        overlay=True,
    )


def _replace_text_in_page(page: fitz.Page, original_text: str, new_text: str) -> bool:
    """Replace a literal text-showing operand without repainting the page."""
    replacement = _encode_pdf_literal(new_text)
    if replacement is None:
        return False

    document = page.parent
    for xref in page.get_contents():
        stream = document.xref_stream(xref)
        match = _find_literal_tj(stream, original_text)
        if match is not None:
            start, end = match
            document.update_stream(xref, stream[:start] + b"(" + replacement + b")" + stream[end:])
            return True

        match = _find_hex_tj(stream, original_text)
        if match is not None:
            start, end = match
            document.update_stream(xref, stream[:start] + b"<" + replacement.hex().upper().encode("ascii") + b">" + stream[end:])
            return True

        match = _find_text_array_tj(stream, original_text)
        if match is not None:
            start, end = match
            document.update_stream(xref, stream[:start] + b"<" + replacement.hex().upper().encode("ascii") + b">" + stream[end:])
            return True

        fragments = _find_fragmented_tj(stream, original_text)
        if fragments is not None:
            updated = bytearray(stream)
            for fragment_index, (start, end, _, is_hex) in reversed(list(enumerate(fragments))):
                if fragment_index == 0:
                    value = b"<" + replacement.hex().upper().encode("ascii") + b">" if is_hex else b"(" + replacement + b")"
                else:
                    value = b"<>" if is_hex else b"()"
                updated[start:end] = value
            document.update_stream(xref, bytes(updated))
            return True
    return False


def replace_text_and_generate(pdf_bytes: bytes, edits: List[Dict]) -> bytes:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    for edit in edits:
        if edit["text"] == edit.get("original_text"):
            continue

        page_number = edit.get("page_number", 0)
        if page_number < 0 or page_number >= len(doc):
            continue  # Skip invalid page references

        page = doc[page_number]
        if not _replace_text_in_page(page, edit.get("original_text", ""), edit["text"]):
            _replace_text_with_background_match(page, edit)

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
    input_path = None
    output_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as input_file:
            input_path = input_file.name
            input_file.write(pdf_bytes)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as output_file:
            output_path = output_file.name

        subprocess.run([
            "qpdf",
            "--object-streams=generate",
            "--stream-data=compress",
            "--linearize",
            input_path,
            output_path,
        ], check=True)

        with open(output_path, "rb") as output_file:
            return output_file.read()
    finally:
        for path in (input_path, output_path):
            if path and os.path.exists(path):
                os.unlink(path)
