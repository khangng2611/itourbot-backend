import express from 'express';
import validate from 'express-validation';
import * as controller from '../../controllers/station.controller.js';
import { authorize, ADMIN } from '../../middlewares/auth.js';
import stationValidation from '../../validations/station.validation.js';

const stationRouter = express.Router();

stationRouter.route('/')
  /**
   * @api {get} v1/stations List Stations
   * @apiDescription Get a list of stations
   * @apiVersion 1.0.0
   * @apiName ListStations
   * @apiGroup Station
   * @apiPermission all
   *
   * @apiHeader {String} Authorization   User's access token
   *
   * @apiParam  {Number{1-}}         [page=1]     List page
   * @apiParam  {Number{1-100}}      [perPage=1]  Stations per page
   * @apiParam  {String}             [name]       Station's name
   *
   * @apiSuccess {Object[]} users List of stations.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  // .get(authorize(), validate(stationValidation.listStations), controller.list)
  .get(validate(stationValidation.listStations), controller.list)
  .post(authorize(ADMIN), validate(stationValidation.createStation), controller.create);

export default stationRouter;
