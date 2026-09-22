import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, required: true, default: false },
  isBlocked: { type: Boolean, default: false },
  avatar: { type: String, default: null },
}, { timestamps: true });

userSchema.methods.matchPassword = async function(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }

  if (typeof this.password === 'string' && this.password.startsWith('$2') && this.password.length === 60) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
