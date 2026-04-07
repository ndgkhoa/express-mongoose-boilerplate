import env from "@/shared/configs/env";
import { getTransporter } from "@/shared/configs/nodemailer";
import { ApiError } from "@/shared/errors/api-error";
import { renderEmailTemplates } from "@/shared/utils/render-template";

type SendMailType = {
  from?: string;
  subject: string;
  data: Record<string, any>;
  email: string;
  html?: string;
  templateName: string;
};

export const sendEmail = async ({
  from,
  email,
  subject,
  data,
  html,
  templateName
}: SendMailType) => {
  const transporter = getTransporter();

  const htmlContent = (await renderEmailTemplates(templateName, data)) || html;

  return transporter
    .sendMail({
      from: from || `<${env.EMAIL_FROM}>`,
      to: email,
      subject,
      replyTo: email,
      html: htmlContent
    })
    .catch(_err => {
      throw ApiError.badRequest("Failed to send email");
    });
};
