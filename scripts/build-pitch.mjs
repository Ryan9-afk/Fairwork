import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "file:///C:/Users/osage/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const workspaceDir = process.cwd();
const SKILL_DIR = "C:/Users/osage/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const TMP_DIR = path.join(workspaceDir, ".codex-pptx-build");
const FINAL_PPTX = path.join(workspaceDir, "docs", "Fairwork-Pulse-Pitch-Deck.pptx");
const RUNTIME_PYTHON = "C:/Users/osage/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const { resolvePresentationFont, finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const font = resolvePresentationFont();
const deck = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const colors = { ink: "#171817", warm: "#F3F1ED", paper: "#FFFFFF", yellow: "#FFD428", mint: "#CCEfD5", blue: "#0A72F5", quiet: "#747873" };

function text(slide, value, left, top, width, height, size, options = {}) {
  const box = slide.shapes.add({ geometry: "textbox", position: { left, top, width, height }, fill: "none", line: { fill: "none", width: 0 } });
  box.text = value;
  box.text.style = { typeface: font, fontSize: size, color: options.color || colors.ink, bold: options.bold || false, autoFit: "shrinkText", verticalAlignment: options.verticalAlignment || "middle", alignment: options.alignment || "left" };
  return box;
}

function base(title, page) {
  const slide = deck.slides.add();
  slide.background.fill = colors.warm;
  text(slide, title, 72, 48, 1070, 60, 32, { bold: true });
  text(slide, String(page).padStart(2, "0"), 1160, 55, 48, 32, 14, { color: colors.quiet, alignment: "right" });
  return slide;
}

let slide = deck.slides.add();
slide.background.fill = colors.warm;
const logoBytes = new Uint8Array(await fs.readFile("C:/Users/osage/Downloads/New cepcj-logo.png"));
slide.images.add({ blob: logoBytes, contentType: "image/png", alt: "CEPCJ organiser logo", fit: "contain", position: { left: 78, top: 58, width: 260, height: 82 } });
text(slide, "Fairwork Pulse", 76, 202, 800, 92, 54, { bold: true });
text(slide, "A worker-controlled record for pay concerns and workplace evidence", 80, 298, 790, 92, 27);
text(slide, "Business and Human Rights Solutions Challenge · Synthetic demonstration", 80, 565, 810, 34, 16, { color: colors.quiet });
slide.shapes.add({ geometry: "rect", position: { left: 1028, top: 0, width: 252, height: 720 }, fill: colors.yellow, line: { fill: "none", width: 0 } });
text(slide, "PROOF\nOF WORK.\nPOWER TO\nSEEK HELP.", 1060, 164, 170, 330, 30, { bold: true });

slide = base("The evidence gap", 2);
text(slide, "When a dispute begins, the worker often has no payslip and must reconstruct the story from memory.", 76, 140, 1100, 110, 32, { bold: true });
text(slide, "Dates fade. Messages scatter. Payment proof sits apart from working hours. A worker can know something is wrong yet still struggle to explain it clearly to an adviser.", 76, 296, 970, 124, 23, { color: colors.quiet });
text(slide, "Our focus: preserve the worker’s own record before details disappear.", 76, 540, 1050, 58, 24, { color: colors.blue, bold: true });

slide = base("The worker journey", 3);
const steps = [["1", "Record the shift", "Date, hours, agreed pay, and payment received"], ["2", "Attach evidence", "Payment screenshot, receipt, or incident photograph"], ["3", "Understand the gap", "Recorded unpaid amount stays separate from estimates"], ["4", "Prepare a dossier", "Choose records, redact details, and print or save as PDF"]];
steps.forEach(([n, heading, body], index) => {
  const y = 132 + index * 125;
  text(slide, n, 80, y, 48, 48, 24, { bold: true, alignment: "center" });
  text(slide, heading, 155, y - 2, 420, 40, 24, { bold: true });
  text(slide, body, 590, y - 2, 590, 50, 18, { color: colors.quiet });
  if (index < steps.length - 1) slide.shapes.add({ geometry: "line", position: { left: 103, top: y + 48, width: 1, height: 70 }, line: { fill: "#C9C8C2", width: 2 } });
});

slide = base("Live demonstration", 4);
text(slide, "Amina’s records are synthetic and clearly marked.", 76, 130, 1100, 70, 30, { bold: true });
text(slide, "Log one construction shift", 76, 255, 330, 60, 22, { bold: true });
text(slide, "Add payment proof and a related wage concern", 458, 255, 340, 88, 22, { bold: true });
text(slide, "Exclude her phone number and export the selected dossier", 846, 255, 350, 100, 22, { bold: true });
text(slide, "The live product carries this slide.", 76, 540, 1040, 62, 23, { color: colors.blue });

slide = base("What the calculation says", 5);
text(slide, "Recorded facts", 76, 142, 480, 42, 24, { bold: true });
text(slide, "Agreed pay\nPayment received\nUnpaid agreed amount", 76, 205, 480, 180, 24);
text(slide, "Estimated entitlement", 680, 142, 480, 42, 24, { bold: true });
text(slide, "Overtime uses entered hours and a stated multiplier. The dossier marks it “Needs review” and lists assumptions.", 680, 205, 470, 156, 23);
text(slide, "Deterministic code performs the arithmetic. AI does not decide the amount.", 76, 530, 1080, 62, 25, { color: colors.blue, bold: true });

slide = base("Worker control and safeguards", 6);
text(slide, "Device-first capture", 76, 142, 360, 44, 23, { bold: true });
text(slide, "Records remain usable during connectivity loss after the application shell has loaded.", 76, 204, 350, 126, 19, { color: colors.quiet });
text(slide, "Private evidence vault", 465, 142, 360, 44, 23, { bold: true });
text(slide, "A worker PIN derives the encryption key. Evidence files receive SHA-256 integrity hashes.", 465, 204, 350, 126, 19, { color: colors.quiet });
text(slide, "Controlled sharing", 854, 142, 350, 44, 23, { bold: true });
text(slide, "The worker selects records and evidence, and can exclude personal details from an export.", 854, 204, 350, 126, 19, { color: colors.quiet });
text(slide, "Demo records cannot upload to a real cloud account.", 76, 527, 1080, 52, 25, { bold: true });

slide = base("Validation and next evidence", 7);
text(slide, "Before submission", 76, 140, 450, 46, 24, { bold: true });
text(slide, "Three users attempt the complete journey without coaching. We record completion time, the first point of confusion, and the changes we make.", 76, 210, 450, 190, 22);
text(slide, "Legal review", 682, 140, 450, 46, 24, { bold: true });
text(slide, "An event law mentor reviews one synthetic scenario, calculation wording, source references, and the assistance checklist. We report unresolved questions honestly.", 682, 210, 450, 190, 22);
text(slide, "Insert completed findings here before presenting.", 76, 548, 1080, 45, 18, { color: colors.quiet });

slide = base("Path to sustained use", 8);
text(slide, "Worker recordkeeping remains free.", 76, 145, 1080, 66, 34, { bold: true });
text(slide, "We will test whether unions, civil-society organizations, labour-support institutions, or responsible businesses will fund training and deployment support.", 76, 250, 1000, 126, 24);
text(slide, "This is the model we intend to validate. We have not claimed partnerships, and we will not sell identifiable worker records.", 76, 424, 1000, 98, 21, { color: colors.quiet });
text(slide, "[TEAM NAME] · [CONTACT] · [DEPLOYED URL]", 76, 610, 1080, 34, 15, { color: colors.blue, bold: true });

const candidatePath = path.join(TMP_DIR, "candidate.pptx");
await (await PresentationFile.exportPptx(deck)).save(candidatePath);
await finalizePresentation({
  explicitTotalSlideCount: 8,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: ["--expected-slide-size-emu", "12192000,6858000", "--validate-heading-fit"],
  fontPolicy: { basis: "design", families: [font] },
  verifyArtifactToolImport: true,
  receiptPath: path.join(TMP_DIR, "pitch.validation.json"),
});
console.log(FINAL_PPTX);
