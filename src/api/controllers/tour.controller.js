import HttpStatus from 'http-status';
import Tour from '../models/tour.model.js';
import APIError from '../errors/api-error.js';
/**
 * Get user list
 * @public
 */
export const list = async (req, res, next) => {
  try {
    const tours = await Tour.list(req.query, req.user._id);
    res.json(tours);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const tour = await Tour.add({ userId: req.user._id, ...req.body });
    res.status(HttpStatus.CREATED);
    res.json(tour);
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    const tour = await Tour.get(req.body.id);
    if (tour.userId.toString() !== req.user._id.toString()) {
      throw new APIError({
        message: 'Forbidden',
        status: HttpStatus.FORBIDDEN,
      });
    }
    tour.status = req.body.status;
    const savedTour = await tour.save();
    res.json(savedTour);
  } catch (error) {
    next(error);
  }
};

export const current = async (req, res, next) => {
  try {
    const lastestTourArr = await Tour.list({ perpage: 1 }, req.user._id);
    const [latestTour] = lastestTourArr;
    if (latestTour.status === 'picking' || latestTour.status === 'leading') {
      return res.json(latestTour);
    }
  } catch (error) {
    next(error);
  }
  return res.json({});
};
