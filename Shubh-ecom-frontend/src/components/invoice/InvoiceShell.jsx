//src/components/invoice/InvoiceShell.jsx

/**
 * InvoiceShell - Reusable wrapper for invoice document display
 * Provides:
 * - Fixed A4-like document width (760px max)
 * - Centered canvas on gray background
 * - Isolated from app typography
 * - Removes box styling on print for full-page appearance
 */
export const InvoiceShell = ({ children, className = '' }) => {
  return (
    <div className={`invoice-shell ${className}`} style={{ background: 'rgba(148, 163, 184, 0.1)', padding: '16px', overflow: 'hidden' }}>
      <style>{`
        @media print {
          .invoice-shell {
            padding: 0 !important;
            background: transparent !important;
          }
          .invoice-shell__page {
            max-width: none !important;
            width: 100% !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div className="invoice-shell__page" style={{ maxWidth: '760px', margin: '0 auto', background: '#ffffff', boxShadow: '0 6px 20px rgba(15, 23, 42, 0.08)' }}>
        {children}
      </div>
    </div>
  );
};
