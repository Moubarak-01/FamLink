
// JWT configuration - secret MUST be set via environment variable
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ JWT_SECRET not set. Using insecure default - DO NOT USE IN PRODUCTION!');
}

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'INSECURE_DEV_ONLY_SECRET_CHANGE_ME',
};
