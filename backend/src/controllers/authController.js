const authService = require('../services/authService');

const login = async (req, res) => {
  const data = await authService.login(req.body.username, req.body.password);
  res.json({ success: true, message: 'Đăng nhập thành công!', data });
};

const getMe = async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ success: true, message: 'OK', data: { user } });
};

const changePassword = async (req, res) => {
  await authService.changePassword(req.user.id, req.body.old_password, req.body.new_password);
  res.json({ success: true, message: 'Đổi mật khẩu thành công!', data: null });
};

const logout = async (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công. Hãy xóa token ở phía client.', data: null });
};

const getAllUsers = async (req, res) => {
  const users = await authService.getAllUsers();
  res.json({ success: true, message: 'OK', data: { users, total: users.length } });
};

const createUser = async (req, res) => {
  const user = await authService.createUser(req.body);
  res.status(201).json({ success: true, message: 'Tạo tài khoản thành công!', data: { user } });
};

module.exports = { login, getMe, changePassword, logout, getAllUsers, createUser };
