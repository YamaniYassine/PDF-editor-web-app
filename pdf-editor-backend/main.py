from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Response
from typing import List, Dict
import json
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import extract_text_items, replace_text_and_generate, merge_pdfs_bytes, delete_pages_from_pdf
import io

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/extract")
async def extract(file: UploadFile = File(...)):
 
    try:
        pdf_bytes = await file.read()
        items = extract_text_items(pdf_bytes)
        return JSONResponse({"items": items})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/replace")
async def replace(
    file: UploadFile = File(...),
    edits: str = Form(...)
):

    try:
        pdf_bytes = await file.read()

        # Parse edits from JSON string
        edits_list: List[Dict] = json.loads(edits)

        # Optional: Validate edits_list has page_number on each item
        for edit in edits_list:
            if "page_number" not in edit:
                raise HTTPException(status_code=400, detail="Each edit must include 'page_number'.")

        # Process PDF with multi-page edits
        new_pdf = replace_text_and_generate(pdf_bytes, edits_list)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(content=new_pdf, media_type="application/pdf")


@app.post("/api/merge")
async def merge_pdfs(files: List[UploadFile] = File(...)):
    try:
        file_bytes_list = [await file.read() for file in files]
        merged_pdf_bytes = merge_pdfs_bytes(file_bytes_list)

        return StreamingResponse(
            io.BytesIO(merged_pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=merged.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/delete-pages")
async def delete_pages(
    file: UploadFile = File(...),
    pages_to_delete: str = Form(...)
):
    try:
        pdf_bytes = await file.read()
        pages_to_delete_list = json.loads(pages_to_delete)

        zero_based_pages = [p - 1 for p in pages_to_delete_list if p > 0]

        cleaned_pdf_bytes = delete_pages_from_pdf(pdf_bytes, zero_based_pages)

        return StreamingResponse(
            io.BytesIO(cleaned_pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=cleaned.pdf"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

