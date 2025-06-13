import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);

    const pdfPath = files.file.filepath;
    const editsJson = fields.edits;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('edits', editsJson);

    const apiRes = await fetch('http://localhost:8000/api/replace', {
      method: 'POST',
      body: formData,
    });

    if (!apiRes.ok) {
      const error = await apiRes.text();
      return res.status(apiRes.status).send(error);
    }

    const arrayBuffer = await apiRes.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.send(Buffer.from(arrayBuffer));
  });
}
