import fs from "node:fs";
import path from "node:path";
import { SKILL_NAMES } from "../config/constants";

export type SkillName = (typeof SKILL_NAMES)[keyof typeof SKILL_NAMES];

export function loadSkill(name: SkillName): string {
  const skillPath = path.join(process.cwd(), ".cursor", "skills", name, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Missing skill file: ${skillPath}`);
  }
  return fs.readFileSync(skillPath, "utf8").trim();
}

export function loadOutreachSkills(): {
  copywriter: string;
  context: string;
} {
  return {
    copywriter: loadSkill(SKILL_NAMES.copywriter),
    context: loadSkill(SKILL_NAMES.context),
  };
}
