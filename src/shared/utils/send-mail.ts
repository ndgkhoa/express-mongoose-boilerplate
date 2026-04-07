import env from "@/shared/configs/env";
import { getTransporter } from "@/shared/configs/nodemailer";
import { ApiError } from "@/shared/errors/api-error";

type sendMail = {
  from?: string;
  subject: string;
  email: string;
  html: string;
};

export const sendEmail = async ({ from, email, subject, html }: sendMail) => {
  const transporter = getTransporter();

  return transporter
    .sendMail({
      from: from || `<${env.EMAIL_FROM}>`,
      to: email,
      subject,
      html
    })
    .catch(_err => {
      throw ApiError.badRequest("Failed to send email");
    });
};
