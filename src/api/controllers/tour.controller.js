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

export const getCurrent = async (req, res, next) => {
  try {
    const lastestTourArr = await Tour.list({ perpage: 1 }, req.user._id);
    const [latestTour] = lastestTourArr;
    if (latestTour.status === 'picking' || latestTour.status === 'leading') {
      const formattedTour = {
        _id: latestTour._id,
        status: latestTour.status,
        userId: latestTour.userId,
        lastStation: latestTour.lastStation,
        // fromStation: {
        //   stationId: latestTour.fromStation,
        //   name: fromStation.name,
        //   location: fromStation.location,
        //   description: fromStation.description,
        // },
        // toStation: {
        //   stationId: latestTour.toStation,
        //   name: toStation.name,
        //   location: toStation.location,
        //   description: toStation.description,
        // },
        fromStation: lastestTourArr.fromStation,
        toStation: latestTour.toStation,
        createdAt: latestTour.createdAt,
        updatedAt: latestTour.updatedAt,
      };
      return res.json(formattedTour);
    }
  } catch (error) {
    next(error);
  }
  return res.json({});
};
