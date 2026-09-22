import jwt from 'jsonwebtoken';
import { connectDBWithRetry } from './db';
import User from './models/User';

export async function authenticate(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) return null;

  const token = authorization.split(' ')[1];
  if (!token) return null;

  try {
    await connectDBWithRetry();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  return authenticate(request);
}
