import type { Phrase } from '../types';
const sourcePhrases = [
  { category: 'Restaurant', fr: 'Peu de piment, s’il vous plaît.', zh: '请少放辣椒。', pinyin: 'Qǐng shǎo fàng làjiāo.' },
  { category: 'Restaurant', fr: 'Sans poivre du Sichuan, s’il vous plaît.', zh: '请不要放花椒。', pinyin: 'Qǐng bú yào fàng huājiāo.' },
  { category: 'Restaurant', fr: 'Je ne mange pas de viande.', zh: '我不吃肉。', pinyin: 'Wǒ bù chī ròu.' },
  { category: 'Restaurant', fr: 'L’addition, s’il vous plaît.', zh: '请买单。', pinyin: 'Qǐng mǎidān.' },
  { category: 'Taxi', fr: 'Emmenez-moi à cette adresse, s’il vous plaît.', zh: '请带我去这个地址。', pinyin: 'Qǐng dài wǒ qù zhège dìzhǐ.' },
  { category: 'Taxi', fr: 'Arrêtez-vous ici, s’il vous plaît.', zh: '请在这里停车。', pinyin: 'Qǐng zài zhèlǐ tíngchē.' },
  { category: 'Aide', fr: 'Pouvez-vous m’aider ?', zh: '您能帮我吗？', pinyin: 'Nín néng bāng wǒ ma?' },
  { category: 'Aide', fr: 'J’ai besoin d’un médecin.', zh: '我需要医生。', pinyin: 'Wǒ xūyào yīshēng.' },
  { category: 'Aide', fr: 'Où sont les toilettes ?', zh: '洗手间在哪里？', pinyin: 'Xǐshǒujiān zài nǎlǐ?' },
  { category: 'Aide', fr: 'Merci !', zh: '谢谢！', pinyin: 'Xièxie!' },
];
export const chinaPhrases: Phrase[] = sourcePhrases.map((phrase,index) => ({id:`china-phrase-${index}`,category:phrase.category,meaning:phrase.fr,local:phrase.zh,pronunciation:phrase.pinyin}));
