const statisticsService = require('../services/statisticsService');

const getDashboard = async (req, res) => {
  const data = await statisticsService.getDashboard();
  res.json({ success: true, message: 'OK', data });
};

const getDailyRevenue = async (req, res) => {
  const { fromDate, toDate } = req.query;
  const from = fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = toDate || new Date().toISOString().slice(0, 10);
  const data = await statisticsService.getDailyRevenue(from, to);
  res.json({ success: true, message: 'OK', data: { revenue: data, fromDate: from, toDate: to } });
};

const getWeeklyRevenue = async (req, res) => {
  const data = await statisticsService.getWeeklyRevenue();
  res.json({ success: true, message: 'OK', data: { revenue: data } });
};

const getMonthlyRevenue = async (req, res) => {
  const year = req.query.year || new Date().getFullYear();
  const data = await statisticsService.getMonthlyRevenue(year);
  res.json({ success: true, message: 'OK', data: { revenue: data, year: parseInt(year) } });
};

const getTopProducts = async (req, res) => {
  const { fromDate, toDate, limit = 10 } = req.query;
  const data = await statisticsService.getTopProducts(fromDate, toDate, limit);
  res.json({ success: true, message: 'OK', data: { products: data, total: data.length } });
};

module.exports = { getDashboard, getDailyRevenue, getWeeklyRevenue, getMonthlyRevenue, getTopProducts };
