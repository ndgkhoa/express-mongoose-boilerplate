import ejs from "ejs";
import path from "node:path";

export async function renderEmailTemplates(
  templateName: string,
  data: Record<string, any>
) {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "templates",
    `${templateName}.ejs`
  );
  return ejs.renderFile(templatePath, data);
}
