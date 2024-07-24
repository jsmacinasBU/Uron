import User from "@models/User";
import UserOTPVerification from '@models/UserOTPVerification';
import { connectToDB } from "@mongodb";
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';

export const POST = async (req) => {
  try {
    await connectToDB();

    const body = await req.json();
    const { userId, otp } = body;

    if (!userId || !otp) {
      return NextResponse.json({ message: "Empty OTP details are not allowed" }, { status: 400 });
    }

    const UserOTPVerificationRecords = await UserOTPVerification.find({ userId });

    if (UserOTPVerificationRecords.length <= 0) {
      return NextResponse.json({ message: "Account record doesn't exist or has been verified already. Please sign up or log in." }, { status: 400 });
    }

    const { expiresAt, otp: hashedOTP } = UserOTPVerificationRecords[0];

    if (expiresAt < Date.now()) {
      await UserOTPVerification.deleteMany({ userId });
      return NextResponse.json({ message: "Code has expired. Please request again." }, { status: 400 });
    }

    const validOTP = await bcrypt.compare(otp, hashedOTP);

    if (!validOTP) {
      return NextResponse.json({ message: "Invalid code passed. Check your inbox." }, { status: 400 });
    }

    await User.updateOne({ _id: userId }, { verified: true });
    await UserOTPVerification.deleteMany({ userId });
    return NextResponse.json({ status: "VERIFIED", message: 'Verified' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
};
