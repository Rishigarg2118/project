import express from 'express';
import { verifyToken, authorizeRoles } from '../middleware/authMiddleware.js';
import { validateBody, assetSchema, assetAllocationSchema } from '../utils/validation.js';
import * as assetController from '../controllers/assetController.js';

const router = express.Router();

// Get all assets
router.get('/', verifyToken, assetController.getAssets);

// Get single asset by ID (with history)
router.get('/:id', verifyToken, assetController.getAssetById);

// Create asset (Admin / HR)
router.post('/', verifyToken, authorizeRoles('admin', 'hr'), validateBody(assetSchema), assetController.createAsset);

// Update asset details (Admin / HR)
router.put('/:id', verifyToken, authorizeRoles('admin', 'hr'), validateBody(assetSchema), assetController.updateAsset);

// Delete asset (Admin / HR)
router.delete('/:id', verifyToken, authorizeRoles('admin', 'hr'), assetController.deleteAsset);

// Allocate asset to employee (Admin / HR / Manager)
router.post('/allocate', verifyToken, authorizeRoles('admin', 'hr', 'manager'), validateBody(assetAllocationSchema), assetController.allocateAsset);

// Return asset (Admin / HR / Manager)
router.put('/return/:id', verifyToken, authorizeRoles('admin', 'hr', 'manager'), assetController.returnAsset);

export default router;
