import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { sealAnswerPayload, unsealAnswerPayload } from './server/cryptoSeal';
import { SAMPLE_ANSWER_KEYS } from './server/sampleAnswerKeys';
import { evaluateQuizAnswers, GradeableQuestionInput } from './src/utils/quizLogic';

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '512kb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'web-quizizz-api' });
  });

  // Menyegel kunci jawaban saat guru/admin menyimpan soal agar correctAnswer tidak terekspos di dokumen publik
  app.post('/api/quiz/seal-answer', (req, res) => {
    try {
      const { questionId, correctAnswer, points, explanation } = req.body ?? {};
      if (
        typeof questionId !== 'string' ||
        questionId.trim().length === 0 ||
        typeof correctAnswer !== 'number' ||
        !Number.isInteger(correctAnswer) ||
        correctAnswer < 0 ||
        correctAnswer > 3
      ) {
        res.status(400).json({ error: 'Payload kunci jawaban tidak valid.' });
        return;
      }

      const sealedKey = sealAnswerPayload({
        questionId: questionId.trim(),
        correctAnswer,
        points: typeof points === 'number' && points > 0 ? points : 20,
        explanation: typeof explanation === 'string' ? explanation.slice(0, 1000) : '',
      });

      res.json({ sealedKey });
    } catch {
      res.status(500).json({ error: 'Gagal menyegel kunci jawaban.' });
    }
  });

  // Menilai quiz di sisi server setelah siswa menekan Selesai
  app.post('/api/quiz/grade', (req, res) => {
    try {
      const { quizId, questions, answers, currentTotalXp } = req.body ?? {};
      if (typeof quizId !== 'string' || !Array.isArray(questions) || typeof answers !== 'object' || answers === null) {
        res.status(400).json({ error: 'Data pengumpulan quiz tidak lengkap.' });
        return;
      }

      const gradeables: GradeableQuestionInput[] = [];
      for (const item of questions) {
        if (!item || typeof item.id !== 'string') continue;

        // 1. Cek apakah soal berasal dari DATA CONTOH di server
        const sampleKey = SAMPLE_ANSWER_KEYS[item.id];
        if (sampleKey) {
          gradeables.push({
            id: item.id,
            correctAnswer: sampleKey.correctAnswer,
            points: sampleKey.points,
            explanation: sampleKey.explanation,
          });
          continue;
        }

        // 2. Cek apakah soal memiliki sealedKey terenkripsi dari guru/admin
        if (typeof item.sealedKey === 'string' && item.sealedKey.length > 0) {
          const unsealed = unsealAnswerPayload(item.sealedKey);
          if (unsealed && unsealed.questionId === item.id) {
            gradeables.push({
              id: item.id,
              correctAnswer: unsealed.correctAnswer,
              points: unsealed.points,
              explanation: unsealed.explanation,
            });
            continue;
          }
        }
      }

      if (gradeables.length === 0) {
        res.status(422).json({
          error: 'Kunci jawaban server untuk quiz ini belum tersedia. Pastikan soal telah disimpan ulang oleh guru.',
        });
        return;
      }

      const result = evaluateQuizAnswers(
        gradeables,
        answers as Record<string, number | null>,
        typeof currentTotalXp === 'number' ? currentTotalXp : 0
      );

      res.json({
        quizId,
        ...result,
      });
    } catch {
      res.status(500).json({ error: 'Terjadi kesalahan saat menilai jawaban quiz.' });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WEB QUIZIZZ server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
