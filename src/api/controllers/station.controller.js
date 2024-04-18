import Station from '../models/station.model.js';
/**
 * Get user list
 * @public
 */
export const list = async (req, res, next) => {
  try {
    const stations = await Station.list(req.query);
    res.json(stations);
  } catch (error) {
    next(error);
  }
};

export const create = async (req, res, next) => {
  try {
    const station = await Station.add(req.body);
    res.json(station);
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const { text } = req.query;
    const results = await Station.find({ $text: { $search: text } });
    res.json(results);
  } catch (error) {
    next(error);
  }
};
