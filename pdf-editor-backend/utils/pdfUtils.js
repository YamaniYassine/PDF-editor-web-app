const { PDFDocument, rgb } = require('pdf-lib');

async function modifyPdf(buffer, edits) {
  const pdfDoc = await PDFDocument.load(buffer);
  const page = pdfDoc.getPages()[0];


  edits.forEach(edit => {
    const { x, y, text } = edit;
    page.drawText(text, {
      x,
      y,
      size: 24,
      color: rgb(1, 0, 0),
    });
  });

  return await pdfDoc.save();
}

module.exports = { modifyPdf };
