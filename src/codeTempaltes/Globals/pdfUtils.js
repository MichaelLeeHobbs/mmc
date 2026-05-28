/**
 * PDF utility functions.
 * @namespace pdfUtils
 */
var pdfUtils = {}

/**
 * Extracts and returns all text from a PDF. Uses the built-in iText library, version 2.1.7.
 * (Formerly extractTextFromPDF)
 * @param {byte[]} pdfBytes - The raw byte array for the PDF.
 * @return {string} The extracted text.
 */
pdfUtils.extractText = function (pdfBytes) {
  const text = new java.lang.StringBuilder()

  let reader
  try {
    reader = new com.lowagie.text.pdf.PdfReader(pdfBytes)
    const extractor = new com.lowagie.text.pdf.parser.PdfTextExtractor(reader)
    const pages = reader.getNumberOfPages()

    for (let i = 1; i <= pages; i++) {
      text.append(extractor.getTextFromPage(i))
      if (i < pages) {
        text.append('\n\n')
      }
    }
  } catch (e) {
    $c('extractTextFromPDFError', e.message)
  } finally {
    if (reader) {
      reader.close()
    }
  }

  return text.toString()
}

/* global com java $c */
/* exported pdfUtils */
