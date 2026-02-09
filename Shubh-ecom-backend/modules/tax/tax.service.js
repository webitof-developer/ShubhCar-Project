const repo = require('./tax.repo');
const { error } = require('../../utils/apiResponse');

class TaxService {
  list(query = {}) {
    const filter = {};
    if (query.hsnCode) filter.hsnCode = query.hsnCode;
    if (query.status) filter.status = query.status;
    return repo.list(filter);
  }

  async create(payload) {
    // Validate HSN code
    if (!payload.hsnCode) {
      error('HSN code is required', 400);
    }
    
    // Trim HSN code
    payload.hsnCode = payload.hsnCode.trim();
    
    // Validate HSN format (exactly 8 digits)
    if (!/^\d{8}$/.test(payload.hsnCode)) {
      error('HSN code must be exactly 8 digits', 400);
    }

    // Check for duplicate HSN code
    const existing = await repo.findByHsnCode(payload.hsnCode);
    if (existing) {
      error('HSN code already exists', 409);
    }

    // Validate rate
    if (payload.rate == null) {
      error('Tax rate is required', 400);
    }
    
    const rate = Number(payload.rate);
    if (isNaN(rate) || rate < 0 || rate > 1) {
      error('Tax rate must be between 0 and 1 (0-100%)', 400);
    }

    // Validate minAmount
    if (payload.minAmount != null) {
      const minAmount = Number(payload.minAmount);
      if (isNaN(minAmount) || minAmount < 0) {
        error('Minimum amount must be a non-negative number', 400);
      }
      payload.minAmount = minAmount;
    }

    // Validate maxAmount
    if (payload.maxAmount != null) {
      const maxAmount = Number(payload.maxAmount);
      if (isNaN(maxAmount) || maxAmount < 0) {
        error('Maximum amount must be a non-negative number', 400);
      }
      
      const minAmount = payload.minAmount || 0;
      if (maxAmount < minAmount) {
        error('Maximum amount must be greater than or equal to minimum amount', 400);
      }
      payload.maxAmount = maxAmount;
    }

    // Validate status
    if (payload.status && !['active', 'inactive'].includes(payload.status)) {
      error('Status must be either active or inactive', 400);
    }

    return repo.create(payload);
  }

  async update(id, payload) {
    // If HSN code is being updated, validate it
    if (payload.hsnCode) {
      payload.hsnCode = payload.hsnCode.trim();
      
      if (!/^\d{8}$/.test(payload.hsnCode)) {
        error('HSN code must be exactly 8 digits', 400);
      }

      // Check for duplicate (excluding current record)
      const existing = await repo.findByHsnCode(payload.hsnCode);
      if (existing && existing._id.toString() !== id) {
        error('HSN code already exists', 409);
      }
    }

    // Validate rate if provided
    if (payload.rate != null) {
      const rate = Number(payload.rate);
      if (isNaN(rate) || rate < 0 || rate > 1) {
        error('Tax rate must be between 0 and 1 (0-100%)', 400);
      }
    }

    // Validate minAmount if provided
    if (payload.minAmount != null) {
      const minAmount = Number(payload.minAmount);
      if (isNaN(minAmount) || minAmount < 0) {
        error('Minimum amount must be a non-negative number', 400);
      }
    }

    // Validate maxAmount relationship
    if (payload.maxAmount != null || payload.minAmount != null) {
      const current = await repo.findById(id);
      const minAmount = payload.minAmount != null ? Number(payload.minAmount) : (current.minAmount || 0);
      const maxAmount = payload.maxAmount != null ? Number(payload.maxAmount) : current.maxAmount;
      
      if (maxAmount != null && maxAmount < minAmount) {
        error('Maximum amount must be greater than or equal to minimum amount', 400);
      }
    }

    // Validate status
    if (payload.status && !['active', 'inactive'].includes(payload.status)) {
      error('Status must be either active or inactive', 400);
    }

    return repo.update(id, payload);
  }

  remove(id) {
    return repo.remove(id);
  }
}

module.exports = new TaxService();
