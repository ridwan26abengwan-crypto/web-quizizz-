import { unsealAnswerPayload } from '../../server/cryptoSeal';
import { SAMPLE_ANSWER_KEYS } from '../../server/sampleAnswerKeys';
import { evaluateQuizAnswers, GradeableQuestionInput } from '../../src/utils/quizLogic';

interface ApiRequest {
  method?: string;
  body?: {
    quizId?: unknown;
    questions?: unknown;
    answers?: unknown;
    currentTotalXp?: unknown;
  };
}

interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (payload: unknown) => void;
}

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { quizId, questions, answers, currentTotalXp } = req.body ?? {};
    if (
      typeof quizId !== 'string' ||
      !Array.isArray(questions) ||
      typeof answers !== 'object' ||
      answers === null
    ) {
      res.status(400).json({ error: 'Data pengumpulan quiz tidak lengkap.' });
      return;
    }

    const gradeables: GradeableQuestionInput[] = [];
    for (const item of questions) {
      if (!item || typeof (item as { id?: unknown }).id !== 'string') continue;
      const qItem = item as { id: string; sealedKey?: string };

      const sampleKey = SAMPLE_ANSWER_KEYS[qItem.id];
      if (sampleKey) {
        gradeables.push({
          id: qItem.id,
          correctAnswer: sampleKey.correctAnswer,
          points: sampleKey.points,
          explanation: sampleKey.explanation,
        });
        continue;
      }

      if (typeof qItem.sealedKey === 'string' && qItem.sealedKey.length > 0) {
        const unsealed = unsealAnswerPayload(qItem.sealedKey);
        if (unsealed && unsealed.questionId === qItem.id) {
          gradeables.push({
            id: qItem.id,
            correctAnswer: unsealed.correctAnswer,
            points: unsealed.points,
            explanation: unsealed.explanation,
          });
        }
      }
    }

    if (gradeables.length === 0) {
      res.status(422).json({ error: 'Kunci jawaban server untuk quiz ini belum tersedia.' });
      return;
    }

    const result = evaluateQuizAnswers(
      gradeables,
      answers as Record<string, number | null>,
      typeof currentTotalXp === 'number' ? currentTotalXp : 0
    );

    res.status(200).json({ quizId, ...result });
  } catch {
    res.status(500).json({ error: 'Terjadi kesalahan saat menilai quiz.' });
  }
}
