"use client";
import React, { useRef, useState } from 'react';
import { Loader2, Download } from 'lucide-react';
import QuotationTemplate from '@/components/invoice/QuotationTemplate';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/logger';
import { toast } from 'sonner';

const normalizeErrorMessage = (err, fallback = 'Failed to generate quotation') => {
  if (!err) return fallback;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string') return err;
  if (typeof err === 'object') {
    if (typeof err.message === 'string' && err.message.trim()) return err.message;
    if (typeof err.type === 'string' && err.type.trim()) {
      return `Unexpected browser error: ${err.type}`;
    }
  }
  return fallback;
};

const renderPrintFallback = (win, element, filename) => {
  if (!win || !element) return false;
  const previousDisplay = element.style.display;
  element.style.display = 'block';
  const html = element.innerHTML;
  element.style.display = previousDisplay || 'none';

  win.document.open();
  win.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            body { margin: 0; font-family: Arial, sans-serif; background: #f3f4f6; }
            .toolbar { position: sticky; top: 0; z-index: 10; background: #111827; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; }
            .btn { background: #2663EB; color: #fff; border: 0; border-radius: 6px; padding: 8px 12px; cursor: pointer; font-weight: 600; }
            .canvas { display: flex; justify-content: center; padding: 16px; }
            .sheet { width: 210mm; min-height: 297mm; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.15); }
            #quotation-template { box-sizing: border-box; max-width: 210mm; margin: 0 auto; color: #111827; }
            #quotation-template * { box-sizing: border-box; }
            #quotation-template table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            #quotation-template thead tr { background: #f9fafb; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb; }
            #quotation-template th,
            #quotation-template td { padding: 10px 12px; font-size: 12px; vertical-align: top; }
            #quotation-template th { text-transform: uppercase; color: #4b5563; font-weight: 600; letter-spacing: 0.02em; }
            #quotation-template tbody tr { border-bottom: 1px solid #f3f4f6; }
            #quotation-template h2 { margin: 0; font-size: 34px; line-height: 1.1; }
            #quotation-template h3 { margin: 0 0 8px 0; }
            #quotation-template p { margin: 0 0 6px 0; }
            #quotation-template img { max-width: 100%; height: auto; }
            #quotation-template .text-right { text-align: right; }
            #quotation-template .text-center { text-align: center; }
            #quotation-template .font-bold { font-weight: 700; }
            #quotation-template .font-semibold { font-weight: 600; }
            #quotation-template .text-orange-600 { color: #ea580c !important; }
            #quotation-template .text-green-600 { color: #16a34a !important; }
            #quotation-template .border-t-2 { border-top: 2px solid #d1d5db !important; }
            @media print {
              .toolbar { display: none; }
              body { background: #fff; }
              .canvas { padding: 0; }
              .sheet { box-shadow: none; width: auto; min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <span>${filename}</span>
            <button class="btn" onclick="window.print()">Print / Save as PDF</button>
          </div>
          <div class="canvas">
            <div class="sheet">${html}</div>
          </div>
        </body>
      </html>
    `);
  win.document.close();
  return true;
};

const QuotationButton = ({ cartItems, summary, profile }) => {
  const componentRef = useRef();
  const previewWindowRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPdf = async () => {
    let win = null;
    let element = null;
    const filename = `Quotation-${new Date().toISOString().split('T')[0]}.pdf`;
    try {
      setIsGenerating(true);
      toast.message('Preparing quotation preview...');

      if (previewWindowRef.current && !previewWindowRef.current.closed) {
        previewWindowRef.current.close();
      }

      win = window.open('', '_blank');
      previewWindowRef.current = win;
      if (!win) {
        throw new Error('Popup blocked. Please allow popups for quotation preview.');
      }
      try {
        win.opener = null;
      } catch {}
      if (win) {
        win.document.write('<html><head><title>Generating Quotation...</title></head><body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;"><div>Generating PDF...</div></body></html>');
      }

      element = componentRef.current;
      if (!element) {
        throw new Error('Quotation content not ready');
      }

      const fallbackOk = renderPrintFallback(win, element, filename);
      if (fallbackOk) {
        toast.message('Opened print view fallback.');
        return;
      }

      throw new Error('Unable to open print view');
    } catch (error) {
      const message = normalizeErrorMessage(error);
      logger.error('Failed to generate quotation:', { message, raw: error });
      if (win && !win.closed) {
        win.close();
      }
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div style={{ display: 'none' }}>
        <div
          ref={componentRef}
          style={{
            '--color-background': '#ffffff',
            '--color-foreground': '#0f172a',
            '--color-card': '#ffffff',
            '--color-card-foreground': '#0f172a',
            '--color-popover': '#ffffff',
            '--color-popover-foreground': '#0f172a',
            '--color-primary': '#2663EB',
            '--color-primary-foreground': '#ffffff',
            '--color-secondary': '#f1f5f9',
            '--color-secondary-foreground': '#0f172a',
            '--color-muted': '#f1f5f9',
            '--color-muted-foreground': '#64748b',
            '--color-accent': '#f1f5f9',
            '--color-accent-foreground': '#0f172a',
            '--color-destructive': '#ef4444',
            '--color-destructive-foreground': '#ffffff',
            '--color-border': '#e2e8f0',
            '--color-input': '#e2e8f0',
            '--color-ring': '#2663EB',
            color: '#0f172a',
            backgroundColor: '#ffffff',
          }}
        >
          <QuotationTemplate
            items={cartItems}
            summary={summary}
            profile={profile}
          />
        </div>
      </div>

      <Button
        onClick={handleDownloadPdf}
        disabled={isGenerating}
        variant="outline"
        className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary transition-colors"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Download className="w-4 h-4 mr-2" />
        )}
        {isGenerating ? 'Generating Quotation...' : 'Download Quotation'}
      </Button>
    </>
  );
};

export default QuotationButton;
