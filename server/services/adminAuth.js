/**
 * CampRoo Admin Authentication Service
 * Strictly restricts admin privileges and traffic/data access to admin "aziz" with password "94883443@Aa".
 */

export const ADMIN_CREDENTIALS = {
  username: 'aziz',
  email: 'aziz@camproo.com',
  password: '94883443@Aa',
  token: 'camproo_admin_sec_94883443_aziz'
};

export const ADMIN_USER_PROFILE = {
  id: 'user-admin',
  name: 'Aziz',
  role: 'admin',
  email: 'aziz@camproo.com',
  username: 'aziz',
  phone: '+1 (800) 555-ROAM',
  avatar: 'https://ui-avatars.com/api/?name=Aziz&background=0284c7&color=fff&bold=true',
  bio: 'Platform Lead & Founder of CampRoo. Managing real network traffic, security, and camper community trust.',
  homeRegion: 'Global Operations HQ',
  yearsRVing: 10,
  joinedYear: 2022,
  rating: 5.0,
  reviewCount: 99,
  verifications: {
    email: true,
    phone: true,
    idDocument: true,
    rvOwnership: true,
  },
  rig: {
    type: 'class_b',
    makeModel: 'Winnebago Revel 4x4',
    lengthFt: 20,
    year: 2024,
  }
};

/**
 * Validate admin login credentials
 */
export function validateAdminLogin(identifier, password) {
  if (!identifier || !password) return false;
  const cleanId = identifier.trim().toLowerCase();
  const isUserMatch = cleanId === ADMIN_CREDENTIALS.username || 
                       cleanId === ADMIN_CREDENTIALS.email ||
                       cleanId === 'realalbadi@gmail.com' ||
                       cleanId === 'aalbadi1911@gmail.com';
  const isPassMatch = password === ADMIN_CREDENTIALS.password;
  return isUserMatch && isPassMatch;
}

/**
 * Express middleware to restrict routes to admin aziz
 */
export function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const xAdminToken = req.headers['x-admin-token'] || '';
  const queryToken = req.query.token || '';

  const token = authHeader.replace(/^Bearer\s+/i, '').trim() || xAdminToken || queryToken;

  if (token === ADMIN_CREDENTIALS.token) {
    req.isAdmin = true;
    return next();
  }

  return res.status(401).json({
    success: false,
    error: 'Unauthorized: Admin access required. Restricted to admin aziz.'
  });
}
