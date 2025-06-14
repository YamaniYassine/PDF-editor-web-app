from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Response
from typing import List, Dict
import json
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import base64, io
from utils import extract_text_items, replace_text_and_generate

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
    """
    Receive raw PDF bytes, return list of text items for page 1.
    """
    try:
        pdf_bytes = await file.read()
        items = extract_text_items(pdf_bytes)
        return JSONResponse({"items": items})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class EditItem(BaseModel):
    text: str
    x: float
    y: float
    font_size: float

class ReplaceRequest(BaseModel):
    buffer: str    
    edits: list    

@app.post("/api/replace")
async def replace(
    file: UploadFile = File(...),
    edits: str = Form(...)
):
    try:
        pdf_bytes = await file.read()

        # Parse edits from JSON string
        edits_list: List[Dict] = json.loads(edits)

        # Process PDF
        new_pdf = replace_text_and_generate(pdf_bytes, edits_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return Response(content=new_pdf, media_type="application/pdf")