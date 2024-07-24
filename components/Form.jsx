"use client";

import {
  Person2Rounded,
  EmailRounded,
  LockRounded,
} from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useState } from "react";

const Form = ({ type }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [otpStep, setOtpStep] = useState(false);

  const onSubmit = async (data) => {
    if (type === "register") {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        setUserId(result.data.userId);
        setOtpStep(true);
        toast.success("Registration successful. Please check your email for the OTP.");
      } else {
        const errorMessage = await res.json();
        toast.error(errorMessage.message);
      }
    }

    if (type === "login") {
      const res = await signIn("credentials", {
        ...data,
        redirect: false,
      });

      if (res.ok) {
        router.push("/chats");
      } else {
        toast.error("Invalid email or password");
      }
    }
  };

  const handleOtpSubmit = async (data) => {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId, otp: data.otp }),
    });

    if (res.ok) {
      toast.success("OTP Verified. Registration complete.");
      router.push("/");
    } else {
      const errorMessage = await res.json();
      toast.error(errorMessage.message);
    }
  };

  return (
    <div className="auth">
      <div className="content">
        <img src="/assets/logo.png" alt="logo" className="logo" />

        {otpStep ? (
          <form className="form" onSubmit={handleSubmit(handleOtpSubmit)}>
            <div>
              <div className="input">
                <LockRounded sx={{ color: "#737373" }} />
                <input
                  defaultValue=""
                  {...register("otp", {
                    required: "OTP is required",
                  })}
                  type="text"
                  placeholder="Enter OTP"
                  className="input-field"
                />
              </div>
              {errors.otp && (
                <p className="text-red-500">{errors.otp.message}</p>
              )}
            </div>

            <button className="button" type="submit">
              Verify OTP
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleSubmit(onSubmit)}>
            {type === "register" && (
              <div>
                <div className="input">
                  <Person2Rounded sx={{ color: "#737373" }} />
                  <input
                    defaultValue=""
                    {...register("username", {
                      required: "Name is required",
                      validate: (value) => {
                        if (value.length < 3) {
                          return "Name must be at least 3 characters";
                        }
                      },
                    })}
                    type="text"
                    placeholder="Name"
                    className="input-field"
                  />
                </div>
                {errors.username && (
                  <p className="text-red-500">{errors.username.message}</p>
                )}
              </div>
            )}

            <div>
              <div className="input">
                <EmailRounded sx={{ color: "#737373" }} />
                <input
                  defaultValue=""
                  {...register("email", { required: "Email is required" })}
                  type="email"
                  placeholder="Email"
                  className="input-field"
                />
              </div>
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="input">
                <LockRounded sx={{ color: "#737373" }} />
                <input
                  defaultValue=""
                  {...register("password", {
                    required: "Password is required",
                    validate: (value) => {
                      if (
                        value.length < 5 ||
                        !value.match(/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/)
                      ) {
                        return "Password must be at least 5 characters and contain at least one special character";
                      }
                    },
                  })}
                  type="password"
                  placeholder="Password"
                  className="input-field"
                />
              </div>
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button className="button" type="submit">
              {type === "register" ? "Register" : "Login"}
            </button>
          </form>
        )}

        {type === "register" ? (
          <Link href="/" className="link">
            <p className="text-center">Already have an account? Sign In</p>
          </Link>
        ) : (
          <Link href="/register" className="link">
            <p className="text-center">Don't have an account? Register</p>
          </Link>
        )}
      </div>
    </div>
  );
};

export default Form;
