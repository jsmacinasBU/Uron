import mongoose from 'mongoose';

const UserOTPVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const UserOTPVerification = mongoose.models.UserOTPVerification || mongoose.model('UserOTPVerification', UserOTPVerificationSchema);

export default UserOTPVerification;
