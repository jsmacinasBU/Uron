import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { sha3_512 } from "js-sha3";

import { connectToDB } from "@mongodb";
import User from "@models/User";


const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      async authorize(credentials, req) {
        if (!credentials.email || !credentials.password) {
          throw new Error("Invalid email or password");
        }

        await connectToDB()

        const user = await User.findOne({ email: credentials.email });

        if (!user || !user?.password) {
          throw new Error("Invalid email or password");
        }

        const hashedPassword = sha3_512(credentials.password);
        if (hashedPassword !== user.password) {
          throw new Error("Invalid email or password");
        }

        return user
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async session({session}) {
      const mongodbUser = await User.findOne({ email: session.user.email })
      session.user.id = mongodbUser._id.toString()

      session.user = {...session.user, ...mongodbUser._doc}

      return session
    }
  }
});

export { handler as GET, handler as POST };
