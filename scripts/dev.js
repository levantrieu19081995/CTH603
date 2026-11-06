// Chạy đồng thời backend (FastAPI, cổng 8000) và frontend (Next.js, cổng 3000).
// Dùng: npm start   hoặc   npm run dev   (chạy từ thư mục gốc CTH603)
const { spawn, spawnSync } = require("child_process");
const path = require("path");

const goc = path.resolve(__dirname, "..");
const env = { ...process.env, PYTHONIOENCODING: "utf-8" };
const children = [];

function chay(ten, lenh, cwd) {
  const p = spawn(lenh, { cwd, env, shell: true, stdio: ["ignore", "pipe", "pipe"] });
  const gan = (s) => (d) =>
    d.toString().split(/\r?\n/).filter(Boolean).forEach((l) => s.write(`[${ten}] ${l}\n`));
  p.stdout.on("data", gan(process.stdout));
  p.stderr.on("data", gan(process.stderr));
  p.on("exit", (code) => {
    console.log(`[${ten}] đã dừng (mã ${code})`);
    dung();
  });
  children.push(p);
}

let dangDung = false;
function dung() {
  if (dangDung) return;
  dangDung = true;
  for (const p of children) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/pid", String(p.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      p.kill("SIGTERM");
    }
  }
  process.exit(0);
}
process.on("SIGINT", dung);
process.on("SIGTERM", dung);

chay("be", "python -m uvicorn src.be.main:app --reload --port 8000 --host 0.0.0.0", goc);
chay("fe", "npm run dev", path.join(goc, "src", "fe"));

console.log("Backend:  http://127.0.0.1:8000/docs\nFrontend: http://localhost:3000\nNhấn Ctrl+C để dừng cả hai.");
