import { introductionQuestions } from './introduction.js';
import { najasahQuestions } from './najasah.js';
import { waterQuestions } from './water.js';
import { sajdahTilawahQuestions } from './sajdah-tilawah.js';
import { wudhuQuestions } from './wudhu.js';
import { ghuslQuestions } from './ghusl.js';
import { tayammumQuestions } from './tayammum.js';
import { khuffsQuestions } from './khuffs.js';
import { jabairQuestions } from './jabair.js';
import { salahQuestions } from './salah.js';
import { adhanQuestions } from './adhan.js';
import { vehiclesQuestions } from './vehicles.js';
import { travelQuestions } from './travel.js';
import { prayerOfTheSickQuestions } from './prayer-of-the-sick.js';
import { masbuqQuestions } from './masbuq.js';

const TOPIC_BANKS = {
  INT: introductionQuestions,
  NJS: najasahQuestions,
  WTR: waterQuestions,
  SJD: sajdahTilawahQuestions,
  WUD: wudhuQuestions,
  GHS: ghuslQuestions,
  TYM: tayammumQuestions,
  KHF: khuffsQuestions,
  JBR: jabairQuestions,
  SLH: salahQuestions,
  ADH: adhanQuestions,
  VEH: vehiclesQuestions,
  TRV: travelQuestions,
  MRD: prayerOfTheSickQuestions,
  MSB: masbuqQuestions,
};

const GROUP_TOPICS = {
  tahara: ['NJS', 'WTR', 'WUD', 'GHS', 'TYM', 'KHF', 'JBR'],
  prayer: ['SJD', 'SLH', 'ADH', 'VEH', 'TRV', 'MRD', 'MSB'],
};

/**
 * Get all Fiqh questions for a topic code, group code, or every topic if 'all'.
 * @param {string} topicCode - e.g. "WUD", "tahara", "prayer", or "all".
 * @returns {Array} question objects
 */
export function getFiqhQuestions(topicCode) {
  if (topicCode === 'all') {
    return Object.values(TOPIC_BANKS).flat();
  }
  if (GROUP_TOPICS[topicCode]) {
    return GROUP_TOPICS[topicCode].flatMap((code) => TOPIC_BANKS[code] || []);
  }
  return TOPIC_BANKS[topicCode] || [];
}
