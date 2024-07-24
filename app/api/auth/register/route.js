import User from "@models/User";
import UserOTPVerification from "@models/UserOTPVerification";
import { connectToDB } from "@mongodb";
import { sha3_512 } from "js-sha3";
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export const POST = async (req) => {
  try {
    await connectToDB();

    const body = await req.json();

    const { username, email, password } = body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    const hashedPassword = sha3_512(password);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      verified: false,
    });

    await newUser.save();

    return await sendOTPVerificationEmail(newUser);

  } catch (err) {
    console.log(err);
    return NextResponse.json({ message: "Failed to create a new user" }, { status: 500 });
  }
};

// FUNCTIONS
let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  auth: {
    user: process.env.AUTH_EMAIL,
    pass: process.env.AUTH_PASS,
  },
});

const sendOTPVerificationEmail = async ({ _id, email }) => {
  try {
    const otp = Math.floor(100_000 + Math.random() * 900_000).toString();
    console.log(`Generated OTP: ${otp}`);

    const mailOptions = {
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verification Code",
      html: `<p>Enter <b>${otp}</b> in the app to verify. This code will expire in <b>5 minutes</b></p>`,
    };

    const saltRounds = 10;
    const hashedOTP = await bcrypt.hash(otp, saltRounds);
    const newOTPverification = new UserOTPVerification({
      userId: _id,
      otp: hashedOTP,
      createdAt: Date.now(),
      expiresAt: Date.now() + 300000,
    });

    await newOTPverification.save();
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      status: "PENDING",
      message: "Verification Code Sent",
      data: {
        userId: _id,
        email,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error generating OTP:', error);
    return NextResponse.json({
      status: "FAILED",
      message: error.message,
    }, { status: 500 });
  }
};
