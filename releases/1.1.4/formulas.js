// Formula contract: 工作文档/体重计算模块开发交接.md (2026-10-31).
// No patient values are persisted or sent by this module.
export const tools = [
  { id: 'bmi', name: '体质指数', en: 'Body mass index', code: 'BMI', description: '计算 BMI 与成人体重分级', fields: ['height', 'weight'], method: '成人 BMI 分级', scope: '采用成人 BMI 分级；不自动适用于儿童、孕妇等人群。', formula: 'BMI = W ÷ (H ÷ 100)²', icon: 'chart' },
  { id: 'sbw', name: '标准体重', en: 'Standard body weight', code: 'SBW', description: '按身高与性别公式估算', fields: ['sex', 'height'], method: '成人身高公式', scope: '文档指定为成人公式。具体身高范围待核实，不提供 ±10% 参考区间。', formula: '男性：SBW = (H − 80) × 0.7\n女性：SBW = (H − 70) × 0.6', icon: 'person' },
  { id: 'lbw', name: '瘦体重', en: 'Lean body weight', code: 'LBW', description: '按实际体重和 BMI 估算', fields: ['sex', 'height', 'weight'], method: '文档指定公式', scope: '公式方法名称与适用体型待核实；不能视为适用于所有体型。', formula: '男性：LBW = 1.10 × W − 0.0128 × BMI × W\n女性：LBW = 1.07 × W − 0.014 × BMI × W\nBMI = W ÷ (H ÷ 100)²', icon: 'person' },
  { id: 'ibw', name: '理想体重', en: 'Ideal body weight', code: 'IBW', description: '按身高减 105 计算', fields: ['height'], method: '身高 − 105', scope: '当前公式不区分性别。适用年龄和身高范围待核实。', formula: 'IBW = H − 105', icon: 'person' },
  { id: 'pbw', name: '预测体重', en: 'Predicted body weight', code: 'PBW', description: '采用固定系数 0.905', fields: ['sex', 'height'], method: '固定系数 0.905', scope: '按工作文档指定的 0.905 计算，适用人群待核实。未关联潮气量或给药计算。', formula: '男性：PBW = 50.0 + 0.905 × (H − 152.4)\n女性：PBW = 45.5 + 0.905 × (H − 152.4)', icon: 'lungs' },
  { id: 'cbw', name: '校正体重', en: 'Corrected body weight', code: 'CBW', description: '成人校正系数 0.4，使用理想体重 IBW', fields: ['height', 'weight'], method: '成人 · 系数 0.4', scope: '成人公式；IBW 沿用本项目 H − 105，不使用标准体重 SBW 或预测体重 PBW 替代。未纳入儿童系数 0.3。', formula: 'CBW = IBW + 0.4 × (W − IBW)\nIBW = H − 105（理想体重）', icon: 'person' }
];

// Retained search interface; UI is disabled by FEATURES.search in app.js.
export function searchTools(query = '') {
  const q = String(query).trim().toLowerCase();
  return tools.filter(t => `${t.name} ${t.code} ${t.en} ${t.description}`.toLowerCase().includes(q));
}

export function calculateAll(input) {
  positiveNumber(input.height, '身高');
  positiveNumber(input.weight, '实际体重');
  if (!['male', 'female'].includes(input.sex)) throw new Error('请选择公式使用的性别分支');
  return Object.fromEntries(tools.map(t => {
    try { return [t.id, calculate(t.id, input)]; }
    catch (error) { return [t.id, { error: error.message }]; }
  }));
}

export function positiveNumber(raw, label) {
  const s = String(raw ?? '').trim();
  if (!s) throw new Error(`请输入${label}`);
  if (s.length > 24 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) throw new Error(`${label}须为有效的正数，请核对输入`);
  const value = Number(s);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label}须大于 0`);
  return value;
}

export function classifyBMI(bmi) {
  if (!Number.isFinite(bmi) || bmi <= 0) throw new Error('BMI 数值无效');
  return bmi < 18.5 ? '偏瘦' : bmi < 24 ? '正常' : bmi < 28 ? '超重' : '肥胖';
}

// Compare decimal input ratios exactly at thresholds, without IEEE-754 boundary drift.
function decimalFraction(raw) {
  const [a, b = ''] = String(raw).trim().split('.');
  return [BigInt((a || '0') + b), 10n ** BigInt(b.length)];
}
export function classifyInputs(height, weight) {
  positiveNumber(height, '身高'); positiveNumber(weight, '实际体重');
  const [h, hd] = decimalFraction(height), [w, wd] = decimalFraction(weight);
  const numerator = w * 10000n * hd * hd;
  const denominator = wd * h * h;
  return numerator * 10n < 185n * denominator ? '偏瘦' : numerator < 24n * denominator ? '正常' : numerator < 28n * denominator ? '超重' : '肥胖';
}

export function format(value) {
  return (Math.round((value + Number.EPSILON * Math.abs(value)) * 10) / 10).toFixed(1);
}

export function calculate(id, input) {
  const tool = tools.find(t => t.id === id);
  if (!tool) throw new Error('未知计算工具');
  const h = tool.fields.includes('height') ? positiveNumber(input.height, '身高') : undefined;
  const w = tool.fields.includes('weight') ? positiveNumber(input.weight, '实际体重') : undefined;
  if (tool.fields.includes('sex') && !['male', 'female'].includes(input.sex)) throw new Error('请选择公式使用的性别分支');
  const male = input.sex === 'male';
  const bmi = h && w ? w / ((h / 100) ** 2) : undefined;
  let value, steps, category;
  switch (id) {
    case 'bmi':
      value = bmi; category = classifyInputs(input.height, input.weight);
      steps = `${w} ÷ (${h} ÷ 100)² = ${format(value)} kg/m²\n分级使用未舍入数值；显示值不用于分级。`; break;
    case 'sbw': value = (h - (male ? 80 : 70)) * (male ? 0.7 : 0.6); steps = `(${h} − ${male ? 80 : 70}) × ${male ? '0.7' : '0.6'} = ${format(value)} kg`; break;
    case 'lbw': value = (male ? 1.10 : 1.07) * w - (male ? 0.0128 : 0.014) * bmi * w;
      steps = `BMI = ${w} ÷ (${h} ÷ 100)²\n${male ? '1.10' : '1.07'} × ${w} − ${male ? '0.0128' : '0.014'} × BMI × ${w} = ${format(value)} kg\n中间 BMI 使用完整精度计算。`; break;
    case 'ibw': value = h - 105; steps = `${h} − 105 = ${format(value)} kg`; break;
    case 'pbw': value = (male ? 50 : 45.5) + 0.905 * (h - 152.4); steps = `${male ? '50.0' : '45.5'} + 0.905 × (${h} − 152.4) = ${format(value)} kg`; break;
    case 'cbw': {
      const ibw = h - 105;
      if (!Number.isFinite(ibw) || ibw <= 0) throw new Error('理想体重 IBW 为非正数，不能用于校正体重；请核对身高和公式适用范围。');
      value = ibw + 0.4 * (w - ibw);
      steps = `理想体重 IBW = ${h} − 105 = ${format(ibw)} kg\n${ibw} + 0.4 × (${w} − ${ibw}) = ${format(value)} kg\n成人校正系数 0.4；中间 IBW 使用完整精度。`;
      break;
    }
  }
  if (!Number.isFinite(value) || value <= 0) throw new Error('计算得到非正数或非有限值，无法作为有效结果；请核对参数与公式适用范围。');
  return { value, display: format(value), unit: id === 'bmi' ? 'kg/m²' : 'kg', category, steps };
}
