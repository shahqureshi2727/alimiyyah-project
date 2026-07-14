// Arabic grammatical role identification questions from Qasas chapters 1-6.
// Each question's `id` follows the pattern ARB-ROL-Q## for traceability.
//
// Question shape:
// {
//   id: "ARB-ROL-Q01",             // unique question ID
//   topic: "ROL",                  // topic code
//   type: "roles",                 // question type for rendering
//   words: ["...", "..."],         // sentence split into tappable tokens
//   role: "...",                   // the grammatical role to identify
//   answerIndex: 0,                // index into `words` of correct token
//   reason: "..."                  // shown after answering (explanation)
// }

export const rolesQuestions = [
  {
    id: 'ARB-ROL-Q01',
    topic: 'ROL',
    type: 'roles',
    words: ['كَانَ', 'اسْمُ', 'هٰذَا', 'الوَلَدِ', 'إِبْرَاهِيمَ'],
    role: 'ism of kaana',
    answerIndex: 1,
    reason: "'ismu' is the subject (ism) of kaana.",
  },
  {
    id: 'ARB-ROL-Q02',
    topic: 'ROL',
    type: 'roles',
    words: ['ضَرَبَ', 'إِبْرَاهِيمُ', 'الأَصْنَامَ'],
    role: "fa'il",
    answerIndex: 1,
    reason: 'Ibrahim is the doer of the verb daraba.',
  },
  {
    id: 'ARB-ROL-Q03',
    topic: 'ROL',
    type: 'roles',
    words: ['ضَرَبَ', 'إِبْرَاهِيمُ', 'الأَصْنَامَ'],
    role: "maf'ul bihi (object)",
    answerIndex: 2,
    reason: 'al-asnaam is what was struck — the object.',
  },
  {
    id: 'ARB-ROL-Q04',
    topic: 'ROL',
    type: 'roles',
    words: ['اسْمُ', 'الوَلَدِ', 'إِبْرَاهِيمُ'],
    role: 'mudaf',
    answerIndex: 0,
    reason: "'ismu' is the mudaf; 'al-waladi' is the mudaf ilayh.",
  },
  {
    id: 'ARB-ROL-Q05',
    topic: 'ROL',
    type: 'roles',
    words: ['اسْمُ', 'الوَلَدِ', 'إِبْرَاهِيمُ'],
    role: 'mudaf ilayh',
    answerIndex: 1,
    reason: "'al-waladi' is the mudaf ilayh, in jarr.",
  },
  {
    id: 'ARB-ROL-Q06',
    topic: 'ROL',
    type: 'roles',
    words: ['إِنَّ', 'الأَصْنَامَ', 'حِجَارَةٌ'],
    role: 'ism of inna',
    answerIndex: 1,
    reason: 'al-asnaam is the ism of inna, in nasb.',
  },
  {
    id: 'ARB-ROL-Q07',
    topic: 'ROL',
    type: 'roles',
    words: ['إِنَّ', 'الأَصْنَامَ', 'حِجَارَةٌ'],
    role: 'khabar of inna',
    answerIndex: 2,
    reason: "hijaarah is the khabar of inna, in raf'.",
  },
  {
    id: 'ARB-ROL-Q08',
    topic: 'ROL',
    type: 'roles',
    words: ['ذَهَبَ', 'النَّاسُ'],
    role: "fa'il",
    answerIndex: 1,
    reason: 'an-naas is the doer of dhahaba.',
  },
  {
    id: 'ARB-ROL-Q09',
    topic: 'ROL',
    type: 'roles',
    words: ['زَيْدٌ', 'تَاجِرٌ'],
    role: 'mubtada',
    answerIndex: 0,
    reason: 'Zaydun is the subject the sentence is about — the mubtada.',
  },
  {
    id: 'ARB-ROL-Q10',
    topic: 'ROL',
    type: 'roles',
    words: ['زَيْدٌ', 'تَاجِرٌ'],
    role: 'khabar',
    answerIndex: 1,
    reason: 'taajirun is the predicate (khabar) giving information about Zayd.',
  },
  // Ch. 5
  {
    id: 'ARB-ROL-Q11',
    topic: 'ROL',
    type: 'roles',
    words: ['فَعَلَهُ', 'كَبِيرُهُمْ', 'هٰذَا'],
    role: "fa'il",
    answerIndex: 1,
    reason: "kabeeruhum is the doer of fa'ala.",
  },
  {
    id: 'ARB-ROL-Q12',
    topic: 'ROL',
    type: 'roles',
    words: ['أَرَادَ', 'النَّاسُ', 'أَنْ', 'يَسْجُدُوا'],
    role: "fa'il",
    answerIndex: 1,
    reason: 'an-naas is the doer of araada.',
  },
  // Ch. 6
  {
    id: 'ARB-ROL-Q13',
    topic: 'ROL',
    type: 'roles',
    words: ['اجْتَمَعَ', 'النَّاسُ'],
    role: "fa'il",
    answerIndex: 1,
    reason: "an-naas is the doer of ijtama'a.",
  },
  {
    id: 'ARB-ROL-Q14',
    topic: 'ROL',
    type: 'roles',
    words: ['إِنَّ', 'إِبْرَاهِيمَ', 'كَسَرَ', 'الأَصْنَامَ'],
    role: 'ism of inna',
    answerIndex: 1,
    reason: 'Ibrahim is the ism of inna, in nasb.',
  },
  {
    id: 'ARB-ROL-Q15',
    topic: 'ROL',
    type: 'roles',
    words: ['لٰكِنَّ', 'اللهَ', 'نَصَرَ', 'إِبْرَاهِيمَ'],
    role: 'ism of laakinna',
    answerIndex: 1,
    reason: 'Allah (in nasb) is the ism of laakinna, a sister of inna.',
  },
  {
    id: 'ARB-ROL-Q16',
    topic: 'ROL',
    type: 'roles',
    words: ['كَانَتِ', 'النَّارُ', 'بَرْدًا'],
    role: 'ism of kaana',
    answerIndex: 1,
    reason: 'an-naar is the ism (subject) of kaana.',
  },
  {
    id: 'ARB-ROL-Q17',
    topic: 'ROL',
    type: 'roles',
    words: ['كَانَتِ', 'النَّارُ', 'بَرْدًا'],
    role: 'khabar of kaana',
    answerIndex: 2,
    reason: 'bardan is the khabar of kaana, in nasb.',
  },
  {
    id: 'ARB-ROL-Q18',
    topic: 'ROL',
    type: 'roles',
    words: ['يَا', 'نَارُ'],
    role: 'munaadaa (the one being called)',
    answerIndex: 1,
    reason: 'naaru is being addressed after yaa — the munaadaa.',
  },
];
