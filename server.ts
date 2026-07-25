import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "1mb" }));

  // API endpoints
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/ai-assistant", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({
          error: "Δεν έχει ρυθμιστεί το GEMINI_API_KEY. Παρακαλώ προσθέστε το κλειδί API στις ρυθμίσεις περιβάλλοντος."
        });
      }

      const { prompt, context } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Απαιτείται ερώτημα (prompt)." });
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `
Είσαι ένας κορυφαίος Ενεργειακός Επιθεωρητής και Ειδικός Σύμβουλος ΤΕΕ-ΚΕΝΑΚ στην Ελλάδα.
Γνωρίζεις άριστα τον ΚΕΝΑΚ (Ν. 4122/2013, ΦΕΚ 407/Β/2017), τις ΤΟΤΕΕ (20701-1/2017, 20701-2/2017, 20701-3/2017, 20701-4/2017, 20701-5/2017) και τις συνήθεις παραδοχές/πρακτικές του φόρουμ μηχανικών (michanikos.gr).

Όταν ο χρήστης σε ρωτάει για τη συμπλήρωση του ΤΕΕ-ΚΕΝΑΚ:
1. Δώσε ακριβείς τυπικές τιμές (U, g, η_g, COP, EER, Ψ, n, F_sh) με αναφορά στον αντίστοιχο Πίνακα ΤΟΤΕΕ ή άρθρο.
2. Εξήγησε σε ποια καρτέλα και πεδίο του λογισμικού ΤΕΕ-ΚΕΝΑΚ καταχωρείται το κάθε μέγεθος.
3. Επισήμανε τυχόν παγίδες, ειδικές περιπτώσεις (π.χ. ΜΘΧ, πιλοτή, υπερδιαστασιολόγηση λέβητα, ηλιακός με μπόιλερ) και απλοποιητικές παραδοχές που επιτρέπονται.
4. Απάντησε πάντα σε άπταιστα, επαγγελματικά Ελληνικά με καθαρή δομή, κουκκίδες και έντονη γραφή στα βασικά μεγέθη.
` + (context ? `\nΠλαίσιο εφαρμογής: ${context}` : "");

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
        },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API error:", error);
      res.status(500).json({
        error: "Σφάλμα κατά την επικοινωνία με τον AI Σύμβουλο: " + (error?.message || "Άγνωστο σφάλμα")
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
