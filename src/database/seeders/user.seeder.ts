import mongoose from "mongoose";

import { connectDB } from "@/shared/configs/db";
import { hashPassword } from "@/shared/helpers/auth.helpers";
import { logger } from "@/shared/utils/logger";

import User from "@/modules/user/user.model";

import { AuthProviderConst, UserRoleConst } from "@/types/enums";

const SEED_USERS = [
  {
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123456",
    role: UserRoleConst.ADMIN,
    isEmailVerified: true
  },
  {
    name: "Alice Johnson",
    email: "alice@example.com",
    password: "User@123456",
    role: UserRoleConst.USER,
    isEmailVerified: true
  },
  {
    name: "Bob Smith",
    email: "bob@example.com",
    password: "User@123456",
    role: UserRoleConst.USER,
    isEmailVerified: false
  }
];

const seedUsers = async () => {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const seed of SEED_USERS) {
    const exists = await User.findOne({ email: seed.email });

    if (exists) {
      logger.info(`Skipped (already exists): ${seed.email}`);
      skipped++;
      continue;
    }

    const hashedPassword = await hashPassword(seed.password);

    await User.create({
      name: seed.name,
      email: seed.email,
      password: hashedPassword,
      role: seed.role,
      isEmailVerified: seed.isEmailVerified,
      provider: AuthProviderConst.LOCAL
    });

    logger.info(`Created [${seed.role}]: ${seed.email}`);
    created++;
  }

  logger.info(`Done — created: ${created}, skipped: ${skipped}`);

  await mongoose.connection.close();
  process.exit(0);
};

seedUsers().catch(err => {
  logger.error(err, "Seeder failed");
  process.exit(1);
});

/*
 * Usage:
 * npx tsx src/database/seeders/user.seeder.ts
 */
