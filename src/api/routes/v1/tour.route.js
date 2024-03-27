import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/tour.controller.js';
import { authorize } from '../../middlewares/auth.js';
import tourValidation from '../../validations/tour.validation.js';

const tourRouter = express.Router();

tourRouter.route('/mockup')
  .post(validate(tourValidation.createTour), controller.createMockup);

tourRouter.route('/')
  .get(authorize(), validate(tourValidation.listTours), controller.list)
  .post(authorize(), validate(tourValidation.createTour), controller.create)
  .patch(authorize(), validate(tourValidation.updateStatus), controller.updateStatus);
export default tourRouter;
