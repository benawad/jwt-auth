import { IResolvers } from "graphql-tools";
import * as bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";

import { User } from "./entity/User";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "./constants";

export const resolvers: IResolvers = {
  Query: {
    me: (_, __, { req }) => {
      if (!req.userId) {
        return null;
      }

      return User.findOne(req.userId);
    }
  },
  Mutation: {
    register: async (_, { email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.create({
        email,
        password: hashedPassword
      }).save();

      return true;
    },
    login: async (_, { email, password }, { res }) => {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return null;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return null;
      }

      const refreshToken = sign(
        { userId: user.id, count: user.count },
        REFRESH_TOKEN_SECRET,
        {
          expiresIn: "7d"
        }
      );
      const accessToken = sign({ userId: user.id }, ACCESS_TOKEN_SECRET, {
        expiresIn: "15min"
      });

      res.cookie("refresh-token", refreshToken);
      res.cookie("access-token", accessToken);

      return user;
    }
  }
};
