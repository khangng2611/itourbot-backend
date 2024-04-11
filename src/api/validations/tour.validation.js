import Joi from 'joi';
import Tour from '../models/tour.model.js';

const tourValidation = {

  // GET /v1/tours
  listTours: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      status: Joi.string(),
      id: Joi.string(),
    },
  },
  createTour: {
    body: {
      fromStation: Joi.number().required(),
      toStation: Joi.array().items(Joi.number().required()).required(),
    },
  },
  updateStatus: {
    body: {
      id: Joi.string().required(),
      status: Joi.string().required().valid(Tour.statuses),
    },
  },
};

export default tourValidation;
