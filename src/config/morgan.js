import morgan from 'morgan';

morgan.token('ip', (req) => req.headers['x-forwarded-for'] || req.headers.host);
morgan.token('user', (req) => {
  if (req.user) { return req.user.email; }
  return 'no user info';
});
morgan.token('team', (req) => {
  if (req.user) { return req.user.team; }
  return '-';
});

export default morgan;
