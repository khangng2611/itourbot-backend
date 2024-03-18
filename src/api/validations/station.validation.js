import Joi from 'joi';
// import Station from '../models/station.model.js';

const stationValidation = {

  // GET /v1/stations
  listStations: {
    query: {
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      name: Joi.string(),
    },
  },
  createStation: {
    body: {
      name: Joi.string().required(),
      stationId: Joi.number().required(),
      rating: Joi.number(),
      imgUrl: Joi.string().uri().required(),
      description: Joi.string(),
    },
  },

};

export default stationValidation;
