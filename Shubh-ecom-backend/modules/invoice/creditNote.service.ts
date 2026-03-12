const Invoice = require('../../models/InvoiceSchema');
const { error } = require('../../utils/apiResponse');
const invoiceService = require('./invoice.service');

class CreditNoteService {
  async generate({ invoiceId }) {
    const originalInvoice = await Invoice.findById(invoiceId);
    if (!originalInvoice) error('Invoice not found', 404);

    const order = {
      _id: originalInvoice.orderId,
      orderNumber: originalInvoice.orderSnapshot?.orderNumber,
      paymentMethod: originalInvoice.orderSnapshot?.paymentMethod,
      paymentStatus: originalInvoice.paymentSnapshot?.status || 'refunded',
    };

    return invoiceService.generateCreditNote(order, originalInvoice);
  }

  async generateFromOrder(order) {
    const originalInvoice = await Invoice.findOne({
      orderId: order._id,
      type: 'invoice',
    });

    if (!originalInvoice) return null;
    return invoiceService.generateCreditNote(order, originalInvoice);
  }
}

module.exports = new CreditNoteService();
