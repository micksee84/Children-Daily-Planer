import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function exportPageToPdf(
  element: HTMLElement,
  filename: string = 'Sunshine-Brigade-Day-Planner.pdf',
  isLandscape: boolean = false
): Promise<void> {
  // Wait for document fonts to finish loading
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font check fails
    }
  }

  // Ensure all images (including sb-logo.svg) inside element are fully loaded
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  // Brief delay to ensure reflow is finalized
  await new Promise((resolve) => setTimeout(resolve, 150));

  // Render to canvas at high resolution (scale 2.5)
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    logging: false,
    backgroundColor: '#FFFFFF',
    windowWidth: isLandscape ? 1056 : 816,
    windowHeight: isLandscape ? 816 : 1056,
  });

  const imgData = canvas.toDataURL('image/png', 1.0);

  // US Letter: 8.5 x 11 inches in points (72 points/inch) = 612 x 792 pt
  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pdfWidth = isLandscape ? 792 : 612;
  const pdfHeight = isLandscape ? 612 : 792;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
  pdf.save(filename);
}
