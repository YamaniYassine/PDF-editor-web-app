import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);
    const pdfBuf = fs.readFileSync(files.file.filepath);
    const apiRes = await fetch('http://localhost:8000/api/extract', {
      method: 'POST',
      body: pdfBuf,
      headers: { 'Content-Type': 'application/pdf' }
    });
    const json = await apiRes.json();
    res.status(200).json(json);
  });
}
