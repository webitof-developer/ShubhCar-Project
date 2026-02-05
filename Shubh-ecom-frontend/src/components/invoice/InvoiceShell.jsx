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
    <div className="bg-secondary/10 p-4 print:bg-transparent print:p-0 overflow-hidden">
      <div className={`max-w-[760px] mx-auto bg-white shadow-lg print:shadow-none print:max-w-none ${className}`}>
        {children}
      </div>
    </div>
  );
};
