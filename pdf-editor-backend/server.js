const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { PDFDocument, rgb } = require("pdf-lib");
const fs = require("fs");
const { modifyPdf } = require('./utils/pdfUtils');
const PORT = 5001;

const app = express();
const upload = multer({ storage: multer.memoryStorage() });


app.use(cors());
app.use(express.json());

router.post("/api/edit-pdf", express.json(), async (req, res) => {
  const originalPdfBytes = fs.readFileSync("./uploads/template.pdf");
  const pdfDoc = await PDFDocument.load(originalPdfBytes);

  const page = pdfDoc.getPages()[0];
  const edits = req.body.edits;

  for (const item of edits) {
    const { str, transform, fontSize } = item;
    const [a, b, c, d, x, y] = transform;

    page.drawText(str, {
      x,
      y,
      size: fontSize,
      color: rgb(0, 0, 0),
    });
  }

  const pdfBytes = await pdfDoc.save();
  res.setHeader("Content-Type", "application/pdf");
  res.send(Buffer.from(pdfBytes));
});






app.get('/', (req, res) => {
  res.send('PDF Editor API is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
