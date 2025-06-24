import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);

    const pdfPath = files.file.filepath;
    const pagesToDelete = fields.pages;

    const formData = new FormData();
    formData.append('file', fs.createReadStream(pdfPath));
    formData.append('pages_to_delete', pagesToDelete);

    const apiRes = await fetch('http://localhost:8000/api/delete-pages', {
      method: 'POST',
      body: formData,
    });

    if (!apiRes.ok) {
      const error = await apiRes.text();
      return res.status(apiRes.status).send(error);
    }

    const arrayBuffer = await apiRes.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cleaned.pdf');
    res.send(Buffer.from(arrayBuffer));
  });
}
