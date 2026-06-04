export type SeedUserConfig = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  memberStatus: 'Regular' | 'Silver' | 'Gold';
  phone: string;
  password: string;
  role: 'ADMIN' | 'STUDENT';
};

function createSeedAvatarUrl(name: string) {
  return `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(name)}`;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requireProductionAdminPassword(password: string) {
  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters long in production.');
  }
}

export function shouldSeedDemoUsers() {
  return process.env.NODE_ENV !== 'production' || process.env.SEED_DEMO_USERS === 'true';
}

export function getSeedAdminUser(): SeedUserConfig | null {
  if (process.env.NODE_ENV !== 'production') {
    return {
      id: 'user-admin',
      name: 'Admin TitipKampus',
      email: 'demo.admin@gmail.com',
      avatar: createSeedAvatarUrl('Admin TitipKampus'),
      memberStatus: 'Gold',
      phone: '080000000000',
      password: 'admin123',
      role: 'ADMIN'
    };
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email && !password) return null;
  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be configured together.');
  }

  requireProductionAdminPassword(password);

  const name = process.env.SEED_ADMIN_NAME?.trim() || 'Admin TitipKampus';
  return {
    id: 'user-admin',
    name,
    email: normalizeEmail(email),
    avatar: process.env.SEED_ADMIN_AVATAR?.trim() || createSeedAvatarUrl(name),
    memberStatus: 'Gold',
    phone: process.env.SEED_ADMIN_PHONE?.trim() || '080000000000',
    password,
    role: 'ADMIN'
  };
}

export function getSeedStudentUser(): SeedUserConfig | null {
  if (!shouldSeedDemoUsers()) return null;

  const name = 'Mahasiswa Demo';
  return {
    id: 'user-demo-student',
    name,
    email: normalizeEmail(process.env.SEED_STUDENT_EMAIL || 'demo.mahasiswa@gmail.com'),
    avatar: process.env.SEED_STUDENT_AVATAR?.trim() || createSeedAvatarUrl(name),
    memberStatus: 'Gold',
    phone: process.env.SEED_STUDENT_PHONE?.trim() || '080000000001',
    password: process.env.SEED_STUDENT_PASSWORD || 'demo1234',
    role: 'STUDENT'
  };
}
