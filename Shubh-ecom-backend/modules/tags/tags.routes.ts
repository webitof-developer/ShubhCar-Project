const express = require('express');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const validateId = require('../../middlewares/objectId.middleware');
const ROLES = require('../../constants/roles');
const controller = require('./tags.controller');
const {
  listTagsQuerySchema,
  createTagSchema,
  updateTagSchema,
} = require('./tags.validator');

const router = express.Router();

router.get('/', validate(listTagsQuerySchema, 'query'), controller.list);
router.post('/', auth([ROLES.ADMIN]), validate(createTagSchema), controller.create);
router.put(
  '/:id',
  auth([ROLES.ADMIN]),
  validateId('id'),
  validate(updateTagSchema),
  controller.update,
);
router.delete('/:id', auth([ROLES.ADMIN]), validateId('id'), controller.remove);

module.exports = router;

