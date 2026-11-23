import { sealAnswerPayload } from '../../server/cryptoSeal';

interface ApiRequest {
  method?: string;
  body?: {
    questionId?: unknown;
    correctAnswer?: unknown;
    points?: unknown;
    explanation?: unknown;
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

    res.status(200).json({ sealedKey });
  } catch {
    res.status(500).json({ error: 'Gagal menyegel kunci jawaban.' });
  }
}
