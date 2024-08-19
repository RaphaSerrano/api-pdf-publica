import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

async function extrairCapaPDF(caminhoArquivo) {
  try {
    const pdfBytes = fs.readFileSync(caminhoArquivo);

    const pdfDoc = await PDFDocument.load(pdfBytes);

    const novoPdfDoc = await PDFDocument.create();
    const [paginaCapa] = await novoPdfDoc.copyPages(pdfDoc, [0]);
    novoPdfDoc.addPage(paginaCapa);

    const capaBytes = await novoPdfDoc.save();

    return capaBytes;
  } catch (erro) {
    console.error(`Erro ao extrair a capa do PDF: ${erro.message}`);
    return null;
  }
}

export default extrairCapaPDF;
