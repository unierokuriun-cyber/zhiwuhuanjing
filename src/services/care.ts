import type { Plant, CareRecord } from "../types";
export const demoWeather = {
  temperature: 24,
  humidity: 68,
  condition: "晴间多云",
  city: "杭州 · 示例城市",
};
const rules: Record<
  string,
  { light: string; fertilize: string; prune: string; focus: string }
> = {
  bougainvillea: {
    light: "逐步适应充足光照，记录日照与花芽变化。",
    fertilize: "开花目标下先评估长势，避免氮肥过量；休眠或弱株暂停施肥。",
    prune: "修剪前辨认花芽与枝条阶段，避免在花期大幅修剪。",
    focus: "关注开花目标、日照和水肥平衡。",
  },
  tomato: {
    light: "提供充足日照与通风，幼苗逐步适应户外。",
    fertilize: "按育苗、开花与结果阶段评估养分，食用植物遵守肥料标签。",
    prune: "检查侧芽与枝条支撑，避免一次去除过多健康叶片。",
    focus: "关注育苗、开花授粉、结果与采收阶段。",
  },
  mint: {
    light: "保持明亮光照与通风，高温时留意叶片状态。",
    fertilize: "生长期按长势评估，采收用叶片避免不明来源肥料。",
    prune: "健康生长期可以适度摘心，保留足够叶片。",
    focus: "定期检查盆土与新叶，避免积水。",
  },
  aglaonema: {
    light: "明亮散射光，避免强烈直射伤叶。",
    fertilize: "健康生长期按长势评估，弱株先观察。",
    prune: "仅移除明确枯损的叶片，保留健康枝叶。",
    focus: "关注叶片色泽与通风。",
  },
  rubber: {
    light: "明亮散射光，逐步调整摆放位置。",
    fertilize: "生长期依长势评估，按肥料标签使用。",
    prune: "修剪前确认枝条状态，接触切口汁液时做好防护。",
    focus: "观察新叶与枝条状态。",
  },
  haworthia: {
    light: "明亮通风，避免突然曝晒。",
    fertilize: "弱株与休眠期暂缓施肥，避免肥料积累。",
    prune: "优先检查枯损叶，避免损伤生长点。",
    focus: "关注盆土干湿、排水与休眠变化。",
  },
  monstera: {
    light: "明亮散射光，避开正午强烈直射。",
    fertilize: "生长期先观察长势，按标签低浓度使用，不对弱株盲目施肥。",
    prune: "优先检查枯损叶，健康叶片和气生根不要随意剪除。",
    focus: "观察新叶展开与光照适应。",
  },
};
export function adviceFor(p: Plant, records: CareRecord[]) {
  const rule = rules[p.speciesId] || rules.monstera;
  const history = records.filter((r) => r.plantId === p.id);
  const count = history.length;
  const weatherDetail =
    p.speciesId === "tomato"
      ? "检查支架与通风，留意花果与叶片状态。"
      : p.speciesId === "bougainvillea"
        ? "留意花芽和新枝，避免突然改变日照。"
        : p.speciesId === "mint"
          ? "检查叶片与盆土，强光时避免失水。"
          : "留意叶片晒伤与空气流通。";
  return {
    ...rule,
    water:
      "未连接传感器，演示湿度不能作为浇水依据。" +
      (p.speciesId === "haworthia"
        ? "检查实际盆土是否充分干燥及排水情况，再评估是否补水；休眠期尤其谨慎。"
        : "先触摸或检查实际盆土、盆重与排水，再决定是否浇水，不按固定天数盲目补水。"),
    fertilize:
      p.stage === "休眠期"
        ? "当前休眠期，先观察，暂缓施肥，不盲目增加水肥。"
        : rule.fertilize,
    stage: `当前为${p.stage}，主要目标是${p.goal}。${p.stage === "休眠期" ? "减少干预，不盲目增加水肥。" : rule.focus} 已有 ${count} 条养护/观察记录。${history[0] ? "最近一条：" + history[0].text : ""}`,
    weather:
      p.location === "阳台" || p.location === "庭院"
        ? `${p.name}位于${p.location}：模拟午后强光，检查遮阴、通风与花盆固定。${weatherDetail}`
        : `${p.name}位于${p.location}：模拟温度 24°C，留意窗边强光和空调冷风。${weatherDetail}`,
  };
}
const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 650));
export const careService = {
  async identify() {
    await delay();
    return [
      { id: "bougainvillea", confidence: 86 },
      { id: "tomato", confidence: 74 },
      { id: "monstera", confidence: 68 },
      { id: "mint", confidence: 61 },
    ];
  },
  async chat(question: string, p: Plant, records: CareRecord[]) {
    await delay();
    const a = adviceFor(p, records);
    const detail = /施肥|肥料/.test(question)
      ? a.fertilize
      : /修剪|剪/.test(question)
        ? a.prune
        : /光照|开花|阳光/.test(question)
          ? a.light
          : /黄|病|异常/.test(question)
            ? "先观察黄叶的位置、盆土、根部与虫害迹象。原因可能多种，请结合异常观察页进一步检查。"
            : a.water;
    return `【模拟规则回复，不是真实 AI 推理】\n关联档案：${p.nickname}（${p.name}）\n${a.stage}\n${detail}\n${a.weather}\n这些是示例建议，请以实际盆土和植物状态为准。`;
  },
  async diagnose(symptom: string, environment: string) {
    await delay();
    return {
      cause:
        symptom === "叶片发黄"
          ? "水分失衡、光照变化或自然老叶代谢均可能出现黄叶。"
          : symptom === "叶片黑斑"
            ? "叶片潮湿、通风不足或损伤均可能形成类似表现。"
            : "缺水、积水、环境变化或虫害均可能产生类似表现。",
      check:
        "检查盆土与排水、叶背是否有虫体、异常是否扩散，并对比近期养护记录。",
      action: `先记录与观察，改善通风，避免盲目增加水肥。${environment ? "你补充的环境：" + environment + "。" : ""} 若异常持续或快速扩散，咨询园艺专业人员。`,
    };
  },
};
