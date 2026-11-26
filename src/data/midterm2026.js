/* ============================================================
 * 2026 美國期中選舉資料（11/3 投票）
 * 數字來源標在每一筆旁邊；「推算」= 由其他公開數字計算得出，非媒體直接公布。
 * ============================================================ */

export const SOURCES = {
  cna:   { name: '中央社〈美期中選舉創多項歷史紀錄〉附圖（2026/11/4 18:00 更新，資料來源 CNN）', url: 'https://www.cna.com.tw/news/aopl/202611040287.aspx' },
  cc:    { name: 'Congress Countdown — 2026 Election Results（標示 11/16 資料）', url: 'https://www.congresscountdown.com/elections/2026' },
  yahoo: { name: 'Yahoo News — Final 2026 midterm election results（2026/11/22 更新）', url: 'https://www.yahoo.com/news/politics/article/lots-of-2026-midterm-races-still-havent-been-called-heres-where-things-stand-205425643.html' },
  ltn:   { name: '自由時報〈民主黨眾院狂掃258席 剩4選區勝負未定〉（2026/11/23）', url: 'https://news.ltn.com.tw/news/world/breakingnews/5650058' },
}

/* 各院席次：D 民主黨、I 獨立（與民主黨同黨團）、R 共和黨、P 開票中／未定、V 空缺 */
export const CHAMBERS = {
  senate: {
    name: '參議院', total: 100, majority: 51,
    note: '本次改選 35 席（33 席例行改選＋佛州、俄州補選），其餘 65 席未改選',
    before: { D: 45, I: 2, R: 53, P: 0, V: 0, src: 'cc' },
    snapshots: [
      { date: '11/04', label: '11/4 開票當晚', D: 52, I: 2, R: 44, P: 2, V: 0, src: 'cna',
        note: '中央社圖表寫「民主黨 54 席」，推算為民主黨 52＋獨立 2' },
      { date: '11/17', label: '11/17 全部確定', D: 54, I: 2, R: 44, P: 0, V: 0, src: 'cc',
        note: '阿拉斯加州 11/17 判定民主黨佩爾托拉勝選，參院全數底定' },
    ],
  },
  house: {
    name: '眾議院', total: 435, majority: 218,
    note: '435 席全部改選',
    before: { D: 214, I: 0, R: 218, P: 0, V: 3, src: 'cna' },
    snapshots: [
      { date: '11/04', label: '11/4 開票當晚', D: 231, I: 0, R: 139, P: 65, V: 0, src: 'cna',
        note: '中央社圖表：仍有 65 席開票中，卻已寫「共和黨 −79 席」' },
      { date: '11/16', label: '11/16', D: 257, I: 0, R: 172, P: 6, V: 0, src: 'cc', note: '' },
      { date: '11/22', label: '11/22 最新', D: 258, I: 0, R: 173, P: 4, V: 0, src: 'yahoo',
        note: '共和黨 173 為推算（435 − 258 − 4）；路易斯安那 2 席 12/12 決選、明尼蘇達 1 區重新計票、田納西 4 區未判定' },
    ],
  },
}

/* 參議院 35 場改選（來源：Congress Countdown；flipped = 改選後換黨） */
export const SENATE_RACES = [
  ['Alabama', 'R', 'Barry Moore', 'R'],
  ['Alaska', 'R', 'Mary Peltola', 'D'],
  ['Arkansas', 'R', 'Tom Cotton', 'R'],
  ['Colorado', 'D', 'John Hickenlooper', 'D'],
  ['Delaware', 'D', 'Chris Coons', 'D'],
  ['Florida', 'R', 'Ashley Moody', 'R', '補選'],
  ['Georgia', 'D', 'Jon Ossoff', 'D'],
  ['Idaho', 'R', 'Jim Risch', 'R'],
  ['Illinois', 'D', 'Juliana Stratton', 'D'],
  ['Iowa', 'R', 'Josh Turek', 'D'],
  ['Kansas', 'R', 'Adam Hamilton', 'D'],
  ['Kentucky', 'R', 'Andy Barr', 'R'],
  ['Louisiana', 'R', 'Julia Letlow', 'R'],
  ['Maine', 'R', 'Troy Jackson', 'D'],
  ['Massachusetts', 'D', 'Ed Markey', 'D'],
  ['Michigan', 'D', 'Abdul El-Sayed', 'D'],
  ['Minnesota', 'D', 'Peggy Flanagan', 'D'],
  ['Mississippi', 'R', 'Scott Colom', 'D'],
  ['Montana', 'R', 'Kurt Alme', 'R'],
  ['Nebraska', 'R', 'Pete Ricketts', 'R'],
  ['New Hampshire', 'D', 'Chris Pappas', 'D'],
  ['New Jersey', 'D', 'Cory Booker', 'D'],
  ['New Mexico', 'D', 'Ben Ray Luján', 'D'],
  ['North Carolina', 'R', 'Roy Cooper', 'D'],
  ['Ohio', 'R', 'Sherrod Brown', 'D', '補選'],
  ['Oklahoma', 'R', 'Kevin Hern', 'R'],
  ['Oregon', 'D', 'Jeff Merkley', 'D'],
  ['Rhode Island', 'D', 'Jack Reed', 'D'],
  ['South Carolina', 'R', 'Annie Andrews', 'D'],
  ['South Dakota', 'R', 'Mike Rounds', 'R'],
  ['Tennessee', 'R', 'Bill Hagerty', 'R'],
  ['Texas', 'R', 'James Talarico', 'D'],
  ['Virginia', 'D', 'Mark Warner', 'D'],
  ['West Virginia', 'R', 'Shelley Moore Capito', 'R'],
  ['Wyoming', 'R', 'Harriet Hageman', 'R'],
].map(([state, before, winner, party, type]) => ({ state, before, winner, party, type: type ?? '例行改選', flipped: before !== party }))

export const STATE_ZH = {
  Alabama: '阿拉巴馬', Alaska: '阿拉斯加', Arkansas: '阿肯色', Colorado: '科羅拉多', Delaware: '德拉瓦',
  Florida: '佛羅里達', Georgia: '喬治亞', Idaho: '愛達荷', Illinois: '伊利諾', Iowa: '愛荷華', Kansas: '堪薩斯',
  Kentucky: '肯塔基', Louisiana: '路易斯安那', Maine: '緬因', Massachusetts: '麻薩諸塞', Michigan: '密西根',
  Minnesota: '明尼蘇達', Mississippi: '密西西比', Montana: '蒙大拿', Nebraska: '內布拉斯加', 'New Hampshire': '新罕布什爾',
  'New Jersey': '紐澤西', 'New Mexico': '新墨西哥', 'North Carolina': '北卡羅來納', Ohio: '俄亥俄', Oklahoma: '奧克拉荷馬',
  Oregon: '奧勒岡', 'Rhode Island': '羅德島', 'South Carolina': '南卡羅來納', 'South Dakota': '南達科他', Tennessee: '田納西',
  Texas: '德州', Virginia: '維吉尼亞', 'West Virginia': '西維吉尼亞', Wyoming: '懷俄明',
}

export const PARTY = {
  D: { name: '民主黨', cls: 'd' },
  I: { name: '獨立（屬民主黨團）', cls: 'i' },
  P: { name: '開票中／未定', cls: 'p' },
  V: { name: '空缺', cls: 'v' },
  R: { name: '共和黨', cls: 'r' },
}
export const ORDER = ['D', 'I', 'P', 'V', 'R']   // 由左到右的排列：民主黨陣營 → 未定 → 共和黨
