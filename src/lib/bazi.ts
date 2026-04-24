
export interface BaziProfile {
  gender: '男' | '女';
  year: string;
  month: string;
  day: string;
  hour: string;
  luckPillar: string;
  age: number;
}

export const WU_SHU_DUN: Record<string, string[]> = {
  '甲': "甲子|乙丑|丙寅|丁卯|戊辰|己巳|庚午|辛未|壬申|癸酉|甲戌|乙亥|丙子".split('|'),
  '己': "甲子|乙丑|丙寅|丁卯|戊辰|己巳|庚午|辛未|壬申|癸酉|甲戌|乙亥|丙子".split('|'),
  '乙': "丙子|丁丑|戊寅|己卯|庚辰|辛巳|壬午|癸未|甲申|乙酉|丙戌|丁亥|戊子".split('|'),
  '庚': "丙子|丁丑|戊寅|己卯|庚辰|辛巳|壬午|癸未|甲申|乙酉|丙戌|丁亥|戊子".split('|'),
  '丙': "戊子|己丑|庚寅|辛卯|壬辰|癸巳|甲午|乙未|丙申|丁酉|戊戌|己亥|庚子".split('|'),
  '辛': "戊子|己丑|庚寅|辛卯|壬辰|癸巳|甲午|乙未|丙申|丁酉|戊戌|己亥|庚子".split('|'),
  '丁': "庚子|辛丑|壬寅|癸卯|甲辰|乙巳|丙午|丁未|戊申|己酉|庚戌|辛亥|壬子".split('|'),
  '壬': "庚子|辛丑|壬寅|癸卯|甲辰|乙巳|丙午|丁未|戊申|己酉|庚戌|辛亥|壬子".split('|'),
  '戊': "壬子|癸丑|甲寅|乙卯|丙辰|丁巳|戊午|己未|庚申|辛酉|壬戌|癸亥|甲子".split('|'),
  '癸': "壬子|癸丑|甲寅|乙卯|丙辰|丁巳|戊午|己未|庚申|辛酉|壬戌|癸亥|甲子".split('|'),
};

export const AI_PROMPT_TEMPLATE = `
## Role: 资深传统命理学家 (Senior Bazi Master)

## Context (命主信息):
- 性别: {gender}
- 八字原局: {yearPillar}(年) {monthPillar}(月) {dayPillar}(日) {hourPillar}(时)
- 当前大运: {luckPillar} ({age}岁)
- 命局简析: 日主【{dayMaster}】，生于{monthZhi}月。

# Current Time (当前流日能量):
- 阳历日期: {year}年{month}月{day}日
- 农历干支: {nongli_str}
- 今日日柱: {currentDayPillar}

## Hourly Pillars (今日时辰干支表):
请基于以下时辰干支，结合“五鼠遁”原理进行流时吉凶分析：
[早子时] 00:00-00:59 : {tp_zi0}
[丑  时] 01:00-02:59 : {tp_chou}
[寅  时] 03:00-04:59 : {tp_yin}
[卯  时] 05:00-06:59 : {tp_mao}
[辰  时] 07:00-08:59 : {tp_chen}
[巳  时] 09:00-10:59 : {tp_si}
[午  时] 11:00-12:59 : {tp_wu}
[未  时] 13:00-14:59 : {tp_wei}
[申  时] 15:00-16:59 : {tp_shen}
[酉  时] 17:00-18:59 : {tp_you}
[戌  时] 19:00-20:59 : {tp_xu}
[亥  时] 21:00-22:59 : {tp_hai}
[夜子时] 23:00-23:59 : {tp_zi24}

## Tasks (分析任务):
1. **今日运势总评**:
   - 分析“流日干支”与“命局、大运”的刑冲合害关系。
   - 评判日主{dayMaster}在今日的强弱状态。
   - 给出今日运势评分（0-100分）。

2. **核心预测任务**:
   - 精准定位对日主有利的时辰（财星/食伤等）。
   - **风控**: 务必排除与日柱“天克地冲”或构成“三刑”的时辰。
   - **输出**: 推荐 1-2 个最佳办事/出行时辰，说明其方位和喜忌。

3. **开运建议**:
   - 今日财神方位。
   - 穿衣颜色建议（五行补救）。

4. **当天的每个时辰运势打分**
    - 满分100
    - 表格形式

### 请以专业、客观、条理清晰的方式输出结果。
`;

export function getHourlyPillars(dayStem: string): string[] {
  const result = WU_SHU_DUN[dayStem];
  if (!result) return Array(13).fill('未知');
  return result;
}

export function generateAIReportPrompt(
  profile: BaziProfile,
  currentDateData: {
    year: number;
    month: number;
    day: number;
    nongli_str: string;
    currentDayPillar: string;
  }
): string {
  const dayStem = currentDateData.currentDayPillar[0];
  const hourlyStems = getHourlyPillars(dayStem);
  
  const placeholders: Record<string, string> = {
    gender: profile.gender,
    yearPillar: profile.year,
    monthPillar: profile.month,
    dayPillar: profile.day,
    hourPillar: profile.hour,
    luckPillar: profile.luckPillar,
    age: profile.age.toString(),
    dayMaster: profile.day[0] || '未知',
    monthZhi: profile.month[1] || '未知',
    year: currentDateData.year.toString(),
    month: currentDateData.month.toString(),
    day: currentDateData.day.toString(),
    nongli_str: currentDateData.nongli_str,
    currentDayPillar: currentDateData.currentDayPillar,
    tp_zi0: hourlyStems[0],
    tp_chou: hourlyStems[1],
    tp_yin: hourlyStems[2],
    tp_mao: hourlyStems[3],
    tp_chen: hourlyStems[4],
    tp_si: hourlyStems[5],
    tp_wu: hourlyStems[6],
    tp_wei: hourlyStems[7],
    tp_shen: hourlyStems[8],
    tp_you: hourlyStems[9],
    tp_xu: hourlyStems[10],
    tp_hai: hourlyStems[11],
    tp_zi24: hourlyStems[12],
  };

  let prompt = AI_PROMPT_TEMPLATE;
  Object.entries(placeholders).forEach(([key, value]) => {
    prompt = prompt.split(`{${key}}`).join(value);
  });

  return prompt;
}
