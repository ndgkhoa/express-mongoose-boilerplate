import { handleToken } from "@/modules/auth/auth.service";
import type { SessionContext } from "@/modules/auth/auth.service";
import User from "@/modules/user/user.model";

type OAuthProfile = {
  provider: string;
  providerId: string;
  name: string;
  email: string | undefined;
  isEmailVerified: boolean;
  avatar: string | undefined;
};

export const handleOAuthLogin = async (
  user: OAuthProfile,
  context: SessionContext
) => {
  const existingUser = await User.findOne({ email: user.email });

  if (existingUser) {
    await User.findByIdAndUpdate(existingUser._id, {
      provider: user.provider,
      providerId: user.providerId,
      isEmailVerified: user.isEmailVerified,
      avatar: {
        url: user.avatar
      }
    });
    await handleToken(
      {
        _id: existingUser._id.toString(),
        role: existingUser.role,
        isEmailVerified: existingUser.isEmailVerified
      },
      context
    );
    return existingUser;
  }

  const newUser = await User.create({
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,

    provider: user.provider,
    providerId: user.providerId,

    avatar: {
      url: user.avatar
    }
  });

  await handleToken(
    {
      _id: newUser._id.toString(),
      role: newUser.role,
      isEmailVerified: newUser.isEmailVerified
    },
    context
  );

  return newUser;
};
