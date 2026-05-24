import './HomeScreen.css';

const modes = [
  {
    id: 'irab',
    titleAr: 'تَحْدِيدُ الإِعْرَاب',
    titleEn: "I'rab Identification",
    description: 'Identify the case of highlighted words',
  },
  {
    id: 'noun',
    titleAr: 'صِفَاتُ الاسْم',
    titleEn: 'Noun Features',
    description: 'Tag definiteness, gender, and number',
  },
  {
    id: 'role',
    titleAr: 'الدَّوْرُ النَّحْوِي',
    titleEn: 'Grammatical Role',
    description: 'Tap the word that fills the role',
  },
  {
    id: 'vocab',
    titleAr: 'المُفْرَدَات',
    titleEn: 'Vocabulary',
    description: 'Flashcard recall from Qasas',
  },
];

export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="title-ar">تَدْرِيبُ قَصَصِ النَّبِيِّين</h1>
        <h2 className="title-en">Qasas Practice</h2>
      </header>

      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className="mode-card"
            onClick={() => onSelectMode(mode.id)}
          >
            <span className="mode-title-ar">{mode.titleAr}</span>
            <span className="mode-title-en">{mode.titleEn}</span>
            <span className="mode-desc">{mode.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
