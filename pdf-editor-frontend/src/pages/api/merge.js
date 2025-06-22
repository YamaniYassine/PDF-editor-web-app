import formidable from 'formidable';
import fs from 'fs';
import FormData from 'form-data';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  const form = new formidable.IncomingForm({ multiples: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);

    const fileArray = Array.isArray(files.file) ? files.file : [files.file];

    const formData = new FormData();
    fileArray.forEach((file) => {
      formData.append('files', fs.createReadStream(file.filepath), file.originalFilename);
    });

    const apiRes = await fetch('http://localhost:8000/api/merge', {
      method: 'POST',
      body: formData,
    });

    if (!apiRes.ok) {
      const error = await apiRes.text();
      return res.status(apiRes.status).send(error);
    }

    const arrayBuffer = await apiRes.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=merged.pdf');
    res.send(Buffer.from(arrayBuffer));
  });
}
