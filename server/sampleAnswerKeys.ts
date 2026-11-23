export interface ServerAnswerKey {
  correctAnswer: number;
  points: number;
  explanation: string;
}

// Kunci jawaban untuk DATA CONTOH hanya disimpan di server dan tidak pernah dikirim ke browser sebelum quiz selesai.
export const SAMPLE_ANSWER_KEYS: Record<string, ServerAnswerKey> = {
  // Quiz 1: Nilai-Nilai Luhur Pancasila dalam Kehidupan
  'q-pancasila-1': {
    correctAnswer: 0,
    points: 20,
    explanation:
      'Sila Pertama (Ketuhanan Yang Maha Esa) mengajarkan sikap saling menghormati kebebasan beragama dan beribadah sesuai keyakinan masing-masing.',
  },
  'q-pancasila-2': {
    correctAnswer: 2,
    points: 20,
    explanation:
      'Bintang emas bersudut lima melambangkan Sila Pertama Pancasila, yaitu Ketuhanan Yang Maha Esa.',
  },
  'q-pancasila-3': {
    correctAnswer: 1,
    points: 20,
    explanation:
      'Musyawarah untuk mencapai mufakat dengan menghargai pendapat semua anggota merupakan pengamalan Sila Keempat Pancasila.',
  },
  'q-pancasila-4': {
    correctAnswer: 3,
    points: 20,
    explanation:
      'Menghormati guru dan membantu teman tanpa membeda-bedakan latar belakang mencerminkan nilai Persatuan Indonesia (Sila Ketiga) dan Kemanusiaan (Sila Kedua).',
  },
  'q-pancasila-5': {
    correctAnswer: 1,
    points: 20,
    explanation:
      'Bersikap adil dalam membagi tugas piket kelas dan tidak merugikan kepentingan umum sesuai dengan Sila Kelima, Keadilan Sosial bagi Seluruh Rakyat Indonesia.',
  },

  // Quiz 2: Norma, Hak, dan Kewajiban Anak Indonesia
  'q-norma-1': {
    correctAnswer: 1,
    points: 20,
    explanation:
      'Norma kesopanan bersumber dari tata pergaulan masyarakat sehari-hari, seperti mengucapkan salam dan berbicara santun kepada orang yang lebih tua.',
  },
  'q-norma-2': {
    correctAnswer: 0,
    points: 20,
    explanation:
      'Mematuhi tata tertib sekolah dan menghormati guru merupakan kewajiban siswa, sedangkan mendapatkan pengajaran adalah hak siswa.',
  },
  'q-norma-3': {
    correctAnswer: 2,
    points: 20,
    explanation:
      'Norma hukum bersifat tegas, tertulis, dan memiliki sanksi nyata dari aparat penegak hukum bagi pelanggarnya.',
  },
  'q-norma-4': {
    correctAnswer: 3,
    points: 20,
    explanation:
      'Hak dan kewajiban harus dilaksanakan secara seimbang agar tercipta ketertiban dan keadilan bersama.',
  },
  'q-norma-5': {
    correctAnswer: 0,
    points: 20,
    explanation:
      'Mengantre dengan tertib saat meminjam buku di perpustakaan sekolah mencerminkan ketaatan terhadap norma di lingkungan sekolah.',
  },

  // Quiz 3: Persatuan dalam Keberagaman Nusantara
  'q-bhinneka-1': {
    correctAnswer: 2,
    points: 20,
    explanation:
      'Semboyan Bhinneka Tunggal Ika berasal dari kitab Sutasoma karangan Mpu Tantular yang berarti berbeda-beda tetapi tetap satu jua.',
  },
  'q-bhinneka-2': {
    correctAnswer: 1,
    points: 20,
    explanation:
      'Gotong royong membersihkan lingkungan sekolah atau desa memperkuat rasa kebersamaan dan persatuan tanpa membedakan suku maupun agama.',
  },
  'q-bhinneka-3': {
    correctAnswer: 3,
    points: 20,
    explanation:
      'Menghargai tarian, pakaian adat, dan bahasa daerah teman dari provinsi lain merupakan wujud sikap toleransi dan pelestarian budaya Nusantara.',
  },
  'q-bhinneka-4': {
    correctAnswer: 0,
    points: 20,
    explanation:
      'Bahasa Indonesia berperan sebagai bahasa persatuan yang menjembatani komunikasi antarwarga dari berbagai suku bangsa.',
  },
  'q-bhinneka-5': {
    correctAnswer: 2,
    points: 20,
    explanation:
      'Ketika terjadi perbedaan pendapat dalam kerja kelompok, sikap terbaik adalah berdiskusi dengan kepala dingin dan mengutamakan kepentingan bersama.',
  },
};
