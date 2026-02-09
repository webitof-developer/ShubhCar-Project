const TaxSlab = require('../../models/TaxSlab.model');

class TaxRepo {
  list(filter = {}) {
    return TaxSlab.find(filter).sort({ hsnCode: 1, minAmount: 1 }).lean();
  }

  findByHsnCode(hsnCode) {
    return TaxSlab.findOne({ hsnCode }).lean();
  }

  findById(id) {
    return TaxSlab.findById(id).lean();
  }

  create(data) {
    return TaxSlab.create(data);
  }

  update(id, data) {
    return TaxSlab.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  remove(id) {
    return TaxSlab.findByIdAndDelete(id);
  }
}

module.exports = new TaxRepo();
