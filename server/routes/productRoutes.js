const express = require('express');
const router = express.Router();
const prdCtrls = require('../controllers/prdCtrls');
const upload = require('../utils/upload');
const validateBody = require('../middlewares/validateBody');
const validateParams = require('../middlewares/validateParams');
const validateQuery = require('../middlewares/validateQuery');

const {
  createProductSchema,
  updateProductSchema,
  getProductByIdSchema,
  deleteProductSchema,
  getAllProductsQuerySchema,
} = require('../validation/productValidator');

const { verifyToken } = require('../utils/helper');
const adminOnly = require('../middlewares/adminOnly');

router.post(
  '/create-product',
  verifyToken,
  adminOnly,
  validateBody(createProductSchema),
  upload.array("images", 5), //max 5 images
  prdCtrls.createProduct
);

router.get(
  '/',
  validateQuery(getAllProductsQuerySchema),
  prdCtrls.getAllProducts
);

router.get(
  '/:id',
  validateParams(getProductByIdSchema),
  prdCtrls.getSingleProduct
);

router.patch(
  '/update-product/:id',
  verifyToken,
  adminOnly,
  validateParams(getProductByIdSchema),
  upload.array("images", 5), //  FIRST
  validateBody(updateProductSchema), //  AFTER
  prdCtrls.updateProduct
);

router.delete(
  '/delete-product/:id',
  verifyToken,
  adminOnly,
  validateParams(deleteProductSchema),
  prdCtrls.deleteProduct
);

module.exports = router;
