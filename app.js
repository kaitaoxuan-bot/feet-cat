/**
 * 上门喂猫 — 宠托师本地工具（前台展示 + 后台配置）
 */
(function () {
  const STORAGE_ORDERS = "cat_sitter_orders_v1";
  const STORAGE_PRICING = "cat_sitter_pricing_v1";
  const STORAGE_WECHAT = "cat_sitter_wechat_v1";
  const STORAGE_PUBLIC = "cat_sitter_public_v1";
  const STORAGE_FEATURED = "cat_sitter_featured_v1";
  const STORAGE_ADMIN_PASSWORD = "cat_sitter_admin_password_v1";

  const defaultPricing = () => ({
    baseLabel: "单次上门（1 只猫）",
    basePrice: 35,
    extraCatLabel: "每多 1 只猫",
    extraCatPrice: 10,
    holidayNote: "节假日可能适度溢价，以微信确认为准。",
    durations: [
      { id: "dur_0", label: "标准 30 分钟", extra: 0 },
      { id: "dur_1", label: "推荐 45 分钟", extra: 10 },
      { id: "dur_2", label: "加长 60 分钟", extra: 20 },
    ],
    addonPillLabel: "口服给药（每粒）",
    addonPillPrice: 5,
    addonInjectionLabel: "皮下注射（每针）",
    addonInjectionPrice: 15,
    addonBrushLabel: "刷毛",
    addonBrushPrice: 10,
    addonEarLabel: "洗耳朵",
    addonEarPrice: 15,
    addonBathLabel: "洗浴",
    addonBathPrice: 80,
    kmLabel: "路程（每公里）",
    kmPrice: 3,
  });

  const defaultWechat = () => "YourWeChatID";

  const defaultPublicProfile = () => ({
    siteName: "喵伴上门",
    heroLine1: "不在家也能让主子",
    heroHighlight: "按时干饭、干净猫砂",
    heroDesc: "专业宠托上门喂猫，服务透明，预约省心。",
    introNoteTitle: "可选说明",
    introNote:
      "如需喂药、特殊性格（怕生/易应激）、钥匙或门禁位置等，请在预约备注里写清楚，上门前会通过微信再次确认。",
    serviceStandards:
      "上门前后手部消毒，穿鞋套入户；按约定完成添粮、换水、铲屎与基础观察；服务过程可拍照/短视频反馈（征得您同意）；产生垃圾随手带走。",
    selfIntro: "本人为持证/有经验宠托师（可按实际修改），服务区域与时段欢迎微信沟通确认。",
    services: [
      { icon: "🍽️", title: "添粮换水", desc: "按习惯补充干粮/湿粮，清洗水碗并换新鲜水。" },
      { icon: "🧹", title: "铲屎清理", desc: "清理猫砂盆，简单打扫周围，垃圾带走。" },
      { icon: "🧸", title: "简单陪玩", desc: "在安全范围内互动，帮助猫咪放松。" },
      { icon: "👀", title: "基础观察", desc: "精神状态、饮食排便简要观察，异常会备注反馈。" },
    ],
    footerScopeTitle: "服务范围",
    footerScope: "默认市区内可上门范围；偏远或交通不便区域请微信沟通确认。",
    footerFaqTitle: "常见问题",
    footerFaqLines: "建议提前 1–2 天预约高峰时段\n钥匙/密码请仅在可信渠道交接\n病猫/孕猫等特殊请先告知",
    footerPromiseTitle: "服务承诺",
    footerPromiseLines: "上门前手部消毒，穿鞋套\n产生的相关垃圾随手带走\n服务过程可拍照反馈（需您同意）",
    posterBottomLine: "消毒 · 鞋套 · 垃圾带走 · 拍照反馈",
  });

  function uid() {
    return "o_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_ORDERS);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
  }

  function mergePricing(raw) {
    const d = defaultPricing();
    if (!raw || typeof raw !== "object") return d;
    const p = { ...d, ...raw };
    if (!Array.isArray(p.durations) || !p.durations.length) p.durations = [...d.durations];
    p.durations = p.durations.map((x, i) => ({
      id: x.id || `dur_${i}`,
      label: String(x.label || "").trim() || d.durations[Math.min(i, d.durations.length - 1)]?.label || `档位 ${i + 1}`,
      extra: Math.max(0, parseFloat(x.extra) || 0),
    }));
    return p;
  }

  function loadPricing() {
    try {
      const raw = localStorage.getItem(STORAGE_PRICING);
      if (!raw) return defaultPricing();
      return mergePricing(JSON.parse(raw));
    } catch {
      return defaultPricing();
    }
  }

  function savePricing(p) {
    localStorage.setItem(STORAGE_PRICING, JSON.stringify(mergePricing(p)));
  }

  function loadWechat() {
    const w = localStorage.getItem(STORAGE_WECHAT);
    return w && w.trim() ? w.trim() : defaultWechat();
  }

  function saveWechat(w) {
    localStorage.setItem(STORAGE_WECHAT, w.trim());
  }

  function loadPublicProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_PUBLIC);
      if (!raw) return defaultPublicProfile();
      const o = JSON.parse(raw);
      const d = defaultPublicProfile();
      const services = Array.isArray(o.services) && o.services.length ? o.services : d.services;
      return { ...d, ...o, services };
    } catch {
      return defaultPublicProfile();
    }
  }

  function savePublicProfile(p) {
    localStorage.setItem(STORAGE_PUBLIC, JSON.stringify(p));
  }

  function loadFeatured() {
    try {
      const raw = localStorage.getItem(STORAGE_FEATURED);
      if (!raw) return [];
      const a = JSON.parse(raw);
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }

  function saveFeatured(list) {
    localStorage.setItem(STORAGE_FEATURED, JSON.stringify(list));
  }

  function orderDates(o) {
    if (Array.isArray(o.dates) && o.dates.length) {
      return [...new Set(o.dates.map(String))].filter(Boolean).sort();
    }
    if (o.date) return [String(o.date)];
    return [];
  }

  function durationExtra(order, pricing) {
    const id = order.durationId;
    const list = mergePricing(pricing).durations;
    const hit = list.find((x) => x.id === id);
    return hit ? parseFloat(hit.extra) || 0 : 0;
  }

  function durationLabel(order, pricing) {
    const id = order.durationId;
    const list = mergePricing(pricing).durations;
    return list.find((x) => x.id === id)?.label || "未选时长";
  }

  function perVisitAddons(order, pricing) {
    const p = mergePricing(pricing);
    const ex = order.extras || {};
    const pills = Math.max(0, parseInt(ex.pills, 10) || 0);
    const inj = Math.max(0, parseInt(ex.injections, 10) || 0);
    const brush = Math.max(0, parseInt(ex.brush, 10) || 0);
    const ear = Math.max(0, parseInt(ex.ear, 10) || 0);
    const bath = Math.max(0, parseInt(ex.bath, 10) || 0);
    let sum = pills * (parseFloat(p.addonPillPrice) || 0) + inj * (parseFloat(p.addonInjectionPrice) || 0);
    sum += brush * (parseFloat(p.addonBrushPrice) || 0);
    sum += ear * (parseFloat(p.addonEarPrice) || 0);
    sum += bath * (parseFloat(p.addonBathPrice) || 0);
    return sum;
  }

  function singleVisitCatBase(order, pricing) {
    const pr = mergePricing(pricing);
    const n = Math.max(1, parseInt(order.catCount, 10) || 1);
    return pr.basePrice + Math.max(0, n - 1) * (parseFloat(pr.extraCatPrice) || 0);
  }

  /** 单次上门合计（含时长加价与增项），不含路程 */
  function singleVisitAmount(order, pricing) {
    return singleVisitCatBase(order, pricing) + durationExtra(order, pricing) + perVisitAddons(order, pricing);
  }

  function orderDistanceAmount(order, pricing) {
    const km = Math.max(0, parseFloat(order.km) || 0);
    return km * (parseFloat(mergePricing(pricing).kmPrice) || 0);
  }

  /** 订单预估总额 */
  function orderAmount(order, pricing) {
    const days = Math.max(1, orderDates(order).length);
    const basePerVisit = singleVisitCatBase(order, pricing) + durationExtra(order, pricing);
    return basePerVisit * days + perVisitAddons(order, pricing) + orderDistanceAmount(order, pricing);
  }

  function explainOrderAmount(order, pricing) {
    const pr = mergePricing(pricing);
    const days = Math.max(1, orderDates(order).length);
    const catBase = singleVisitCatBase(order, pr);
    const dur = durationExtra(order, pr);
    const addons = perVisitAddons(order, pr);
    const basePerVisit = catBase + dur;
    const perVisit = basePerVisit + addons;
    const dist = orderDistanceAmount(order, pr);
    const total = basePerVisit * days + addons + dist;

    const lines = [];
    
    const catCount = Math.max(1, parseInt(order.catCount, 10) || 1);
    lines.push(`📅 服务天数：${days} 天`);
    lines.push(`🐱 猫咪数量：${catCount} 只`);
    lines.push(``);
    
    lines.push(`💰 基础套餐：¥${pr.basePrice}（含第1只猫）`);
    if (catCount > 1) {
      const extraCats = catCount - 1;
      const extraCatPrice = extraCats * (parseFloat(pr.extraCatPrice) || 0);
      lines.push(`   └─ 额外猫咪：${extraCats} 只 × ¥${pr.extraCatPrice}/只 = ¥${extraCatPrice.toFixed(0)}`);
    }
    lines.push(`   └─ 小计：¥${catBase.toFixed(0)}/次 × ${days} 天 = ¥${(catBase * days).toFixed(0)}`);
    
    if (dur > 0) {
      const durLabel = durationLabel(order, pr);
      lines.push(`⏱️ 服务时长：${durLabel}（加价 ¥${dur.toFixed(0)}/次）`);
      lines.push(`   └─ 小计：¥${dur.toFixed(0)}/次 × ${days} 天 = ¥${(dur * days).toFixed(0)}`);
    }
    
    const ex = order.extras || {};
    const pills = Math.max(0, parseInt(ex.pills, 10) || 0);
    const inj = Math.max(0, parseInt(ex.injections, 10) || 0);
    const brush = Math.max(0, parseInt(ex.brush, 10) || 0);
    const ear = Math.max(0, parseInt(ex.ear, 10) || 0);
    const bath = Math.max(0, parseInt(ex.bath, 10) || 0);
    
    if (pills > 0 || inj > 0 || brush > 0 || ear > 0 || bath > 0) {
      lines.push(`🎁 服务增项（按次数计算，非每次上门）：`);
      if (pills > 0) {
        const pillPrice = pills * (parseFloat(pr.addonPillPrice) || 0);
        lines.push(`   └─ ${pr.addonPillLabel}：${pills} 粒 × ¥${pr.addonPillPrice}/粒 = ¥${pillPrice.toFixed(0)}`);
      }
      if (inj > 0) {
        const injPrice = inj * (parseFloat(pr.addonInjectionPrice) || 0);
        lines.push(`   └─ ${pr.addonInjectionLabel}：${inj} 针 × ¥${pr.addonInjectionPrice}/针 = ¥${injPrice.toFixed(0)}`);
      }
      if (brush > 0) {
        const brushPrice = brush * (parseFloat(pr.addonBrushPrice) || 0);
        lines.push(`   └─ ${pr.addonBrushLabel}：${brush} 次 × ¥${pr.addonBrushPrice}/次 = ¥${brushPrice.toFixed(0)}`);
      }
      if (ear > 0) {
        const earPrice = ear * (parseFloat(pr.addonEarPrice) || 0);
        lines.push(`   └─ ${pr.addonEarLabel}：${ear} 次 × ¥${pr.addonEarPrice}/次 = ¥${earPrice.toFixed(0)}`);
      }
      if (bath > 0) {
        const bathPrice = bath * (parseFloat(pr.addonBathPrice) || 0);
        lines.push(`   └─ ${pr.addonBathLabel}：${bath} 次 × ¥${pr.addonBathPrice}/次 = ¥${bathPrice.toFixed(0)}`);
      }
      lines.push(`   └─ 增项合计：¥${addons.toFixed(0)}`);
    }
    
    if (dist > 0) {
      const km = parseFloat(order.km) || 0;
      lines.push(`🚗 路程费：${km.toFixed(1)} km × ¥${pr.kmPrice}/km = ¥${dist.toFixed(0)}`);
    }
    
    lines.push(``);
    lines.push(`✨ 每次上门费用：¥${perVisit.toFixed(0)}`);
    lines.push(`✨ 预估合计：¥${total.toFixed(0)}`);

    return { lines, total, days, perVisit, catBase, dur, addons, dist, pr };
  }

  function showToast(msg) {
    let el = document.getElementById("global-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "global-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.display = "block";
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => {
      el.style.display = "none";
    }, 2200);
  }

  function escapeHtml(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  /** ---------- 前台 index ---------- */
  function renderIndexPublic() {
    const pub = loadPublicProfile();
    const pricing = loadPricing();
    const wechat = loadWechat();

    document.querySelectorAll("[data-slot-brand]").forEach((el) => {
      el.textContent = pub.siteName;
    });

    const hero = document.getElementById("slot-hero");
    if (hero) {
      hero.innerHTML = `
        <p class="text-sm font-semibold uppercase tracking-widest text-pink-500">上门喂猫 · 宠托服务</p>
        <h1 class="text-3xl font-extrabold leading-tight text-stone-900 md:text-4xl">
          ${escapeHtml(pub.heroLine1)}<br class="md:hidden" />
          <span class="text-pink-600">${escapeHtml(pub.heroHighlight)}</span>
        </h1>
        <p class="mx-auto max-w-xl text-stone-600">${escapeHtml(pub.heroDesc)}</p>
        <div class="flex flex-wrap justify-center gap-3 pt-2">
          <a href="#book" class="btn-primary">立即预约</a>
          <a href="#pricing" class="btn-ghost">先看价格</a>
          <button type="button" id="btn-share" class="rounded-xl border-2 border-pink-200 bg-white/90 px-4 py-2 text-sm font-semibold text-pink-600 shadow-sm hover:bg-pink-50 flex items-center gap-2">
            <span>📤</span>分享链接
          </button>
        </div>`;
    }

    const svc = document.getElementById("slot-services");
    if (svc) {
      svc.innerHTML =
        '<ul class="space-y-4 text-stone-700">' +
        pub.services
          .map(
            (it) => `
        <li class="flex gap-3">
          <span class="text-xl">${escapeHtml(it.icon || "🐾")}</span>
          <div><strong class="text-stone-900">${escapeHtml(it.title)}</strong><p class="text-sm text-stone-600 mt-0.5">${escapeHtml(it.desc)}</p></div>
        </li>`
          )
          .join("") +
        "</ul>";
    }

    const note = document.getElementById("slot-intro-note");
    if (note) {
      note.innerHTML = `
        <h3 class="font-bold text-pink-800 mb-2">${escapeHtml(pub.introNoteTitle)}</h3>
        <p class="text-sm text-stone-700 leading-relaxed">${escapeHtml(pub.introNote).replace(/\n/g, "<br/>")}</p>`;
    }

    const pr = mergePricing(pricing);
    const durRows = pr.durations
      .map((d) => `<li class="flex justify-between gap-2 text-sm"><span>${escapeHtml(d.label)}</span><span class="text-pink-600 font-semibold">${d.extra > 0 ? "+¥" + d.extra + "/次" : "含在基础价"}</span></li>`)
      .join("");

    const priceSlot = document.getElementById("slot-pricing");
    if (priceSlot) {
      priceSlot.innerHTML = `
        <div class="rounded-2xl bg-white/90 border border-pink-100 p-5 space-y-4">
          <div class="flex justify-between items-baseline gap-3 flex-wrap">
            <span class="font-medium text-stone-800">${escapeHtml(pr.baseLabel)}</span>
            <span class="text-xl font-extrabold text-pink-600">¥${pr.basePrice}</span>
          </div>
          <div class="flex justify-between items-baseline gap-3 flex-wrap text-stone-700">
            <span>${escapeHtml(pr.extraCatLabel)}</span>
            <span class="font-semibold text-pink-600">+¥${pr.extraCatPrice}</span>
          </div>
          <div class="border-t border-pink-100 pt-3">
            <p class="text-xs font-bold text-stone-700 mb-2">服务时长（每次上门）</p>
            <ul class="space-y-1.5">${durRows}</ul>
          </div>
          <div class="border-t border-pink-100 pt-3 space-y-2">
            <p class="text-xs font-bold text-stone-700">可选增项</p>
            <ul class="text-sm text-stone-700 space-y-1">
              <li class="flex justify-between gap-2"><span>${escapeHtml(pr.addonPillLabel)}</span><span class="text-pink-600">¥${pr.addonPillPrice}/粒</span></li>
              <li class="flex justify-between gap-2"><span>${escapeHtml(pr.addonInjectionLabel)}</span><span class="text-pink-600">¥${pr.addonInjectionPrice}/针</span></li>
              <li class="flex justify-between gap-2"><span>${escapeHtml(pr.addonBrushLabel)}</span><span class="text-pink-600">¥${pr.addonBrushPrice}/次</span></li>
              <li class="flex justify-between gap-2"><span>${escapeHtml(pr.addonEarLabel)}</span><span class="text-pink-600">¥${pr.addonEarPrice}/次</span></li>
              <li class="flex justify-between gap-2"><span>${escapeHtml(pr.addonBathLabel)}</span><span class="text-pink-600">¥${pr.addonBathPrice}/次</span></li>
            </ul>
          </div>
          <div class="border-t border-pink-100 pt-3 flex justify-between gap-2 text-sm">
            <span>${escapeHtml(pr.kmLabel)}</span>
            <span class="text-pink-600 font-semibold">¥${pr.kmPrice}/km（整单）</span>
          </div>
          ${pr.holidayNote ? `<p class="text-sm text-amber-800 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">${escapeHtml(pr.holidayNote)}</p>` : ""}
        </div>
        <p class="text-xs text-stone-500 mt-3">价格由宠托师在后台维护；下单页可勾选增项并试算「预估合计」，最终以微信确认为准。</p>`;
    }

    const wx = document.getElementById("wechat-id");
    if (wx) wx.textContent = wechat;

    const featSection = document.getElementById("featured");
    const featSlot = document.getElementById("slot-featured");
    const visibleFeat = loadFeatured().filter((it) => it.show && (it.title || it.desc || it.image));
    if (featSection && featSlot) {
      if (!visibleFeat.length) {
        featSection.classList.add("hidden");
      } else {
        featSection.classList.remove("hidden");
        featSlot.innerHTML =
          '<div class="grid sm:grid-cols-2 gap-5">' +
          visibleFeat
            .map((it) => {
              const img = it.image
                ? `<div class="aspect-[4/3] rounded-2xl overflow-hidden border border-pink-100 bg-pink-50"><img src="${it.image}" alt="" class="w-full h-full object-cover"/></div>`
                : `<div class="aspect-[4/3] rounded-2xl border border-dashed border-pink-200 bg-pink-50/50 flex items-center justify-center text-3xl">🐱</div>`;
              return `<article class="space-y-2">${img}<h3 class="font-bold text-stone-900">${escapeHtml(it.title || "推荐")}</h3><p class="text-sm text-stone-600 leading-relaxed">${escapeHtml(it.desc || "").replace(/\n/g, "<br/>")}</p></article>`;
            })
            .join("") +
          "</div>";
      }
    }

    const foot = document.getElementById("slot-footer");
    if (foot) {
      const faqItems = pub.footerFaqLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join("");
      const promiseItems = pub.footerPromiseLines
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join("");

      foot.innerHTML = `
        <div>
          <h3 class="font-bold text-stone-900 mb-3 flex items-center gap-2"><span>📍</span>${escapeHtml(pub.footerScopeTitle)}</h3>
          <p class="text-stone-600 leading-relaxed">${escapeHtml(pub.footerScope)}</p>
        </div>
        <div>
          <h3 class="font-bold text-stone-900 mb-3 flex items-center gap-2"><span>❓</span>${escapeHtml(pub.footerFaqTitle)}</h3>
          <ul class="text-stone-600 space-y-2 list-disc list-inside">${faqItems}</ul>
        </div>
        <div>
          <h3 class="font-bold text-stone-900 mb-3 flex items-center gap-2"><span>✨</span>${escapeHtml(pub.footerPromiseTitle)}</h3>
          <ul class="text-stone-600 space-y-2">${promiseItems}</ul>
        </div>`;
    }

    document.title = `${pub.siteName} · 上门喂猫预约`;

    const lblPill = document.getElementById("lbl-pill");
    const lblInj = document.getElementById("lbl-injection");
    const lblBrush = document.getElementById("lbl-brush");
    const lblEar = document.getElementById("lbl-ear");
    const lblBath = document.getElementById("lbl-bath");
    const lblKm = document.getElementById("lbl-km");
    if (lblPill) lblPill.textContent = `${pr.addonPillLabel}（粒数）`;
    if (lblInj) lblInj.textContent = `${pr.addonInjectionLabel}（针数）`;
    if (lblBrush) lblBrush.textContent = `${pr.addonBrushLabel}（+¥${pr.addonBrushPrice}/次）`;
    if (lblEar) lblEar.textContent = `${pr.addonEarLabel}（+¥${pr.addonEarPrice}/次）`;
    if (lblBath) lblBath.textContent = `${pr.addonBathLabel}（+¥${pr.addonBathPrice}/次）`;
    if (lblKm) lblKm.textContent = `${pr.kmLabel}（公里，整单加收 ¥${pr.kmPrice}/km）`;

    const durSel = document.getElementById("f-duration");
    if (durSel) {
      durSel.innerHTML = pr.durations.map((d) => `<option value="${escapeHtml(d.id)}">${escapeHtml(d.label)}${d.extra > 0 ? "（+¥" + d.extra + "/次）" : ""}</option>`).join("");
    }
  }

  function readFormDraftOrder(selectedDates) {
    const cats = Math.max(1, parseInt(document.getElementById("f-cats")?.value, 10) || 1);
    const durationId = document.getElementById("f-duration")?.value || loadPricing().durations[0]?.id;
    const extras = {
      pills: Math.max(0, parseInt(document.getElementById("f-pills")?.value, 10) || 0),
      injections: Math.max(0, parseInt(document.getElementById("f-injections")?.value, 10) || 0),
      brush: !!document.getElementById("f-brush")?.checked,
      ear: !!document.getElementById("f-ear")?.checked,
      bath: !!document.getElementById("f-bath")?.checked,
    };
    const km = Math.max(0, parseFloat(document.getElementById("f-km")?.value) || 0);
    const dates = selectedDates.length ? [...selectedDates].sort() : [];
    return { catCount: cats, dates, durationId, extras, km };
  }

  function updateQuote(selectedDates, pricing) {
    const ul = document.getElementById("quote-lines");
    const totalEl = document.getElementById("quote-total");
    if (!ul || !totalEl) return;
    const draft = readFormDraftOrder(selectedDates);
    if (!draft.dates.length) {
      ul.innerHTML =
        '<li>尚未添加预约日期，以下按 <strong>1 天</strong> 试算；添加日期后会自动乘以天数。</li>';
      draft.dates = [new Date().toISOString().slice(0, 10)];
    } else {
      ul.innerHTML = "";
    }
    const { lines, total } = explainOrderAmount(draft, pricing);
    lines.forEach((t) => {
      const li = document.createElement("li");
      li.textContent = t;
      ul.appendChild(li);
    });
    totalEl.textContent = "¥" + total.toFixed(0);
  }

  function initIndex() {
    renderIndexPublic();
    const pricing = loadPricing();

    const btnCopyWechat = document.getElementById("btn-copy-wechat");
    if (btnCopyWechat) {
      btnCopyWechat.addEventListener("click", async () => {
        const text = loadWechat();
        try {
          await navigator.clipboard.writeText(text);
          showToast("已复制微信号");
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          showToast("已复制微信号");
        }
      });
    }

    const btnShare = document.getElementById("btn-share");
    if (btnShare) {
      btnShare.addEventListener("click", async () => {
        const shareUrl = window.location.href;
        const shareText = `需要上门喂猫服务？点击链接在线预约 → ${shareUrl}`;
        
        try {
          if (navigator.share) {
            await navigator.share({
              title: document.title,
              text: shareText,
              url: shareUrl
            });
          } else {
            await navigator.clipboard.writeText(shareUrl);
            showToast("链接已复制，可粘贴到聊天窗口");
          }
        } catch (err) {
          const ta = document.createElement("textarea");
          ta.value = shareUrl;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          showToast("链接已复制，可粘贴到聊天窗口");
        }
      });
    }

    const selectedDates = [];
    const chipsEl = document.getElementById("date-chips");
    const dateAdd = document.getElementById("f-date-add");
    const btnAddDate = document.getElementById("btn-add-date");
    const form = document.getElementById("order-form");

    function todayStr() {
      return new Date().toISOString().slice(0, 10);
    }

    function renderDateChips() {
      if (!chipsEl) return;
      chipsEl.innerHTML = selectedDates
        .map(
          (d) =>
            `<span class="date-chip">${escapeHtml(d)}<button type="button" aria-label="移除" data-remove-date="${escapeHtml(d)}">×</button></span>`
        )
        .join("");
      chipsEl.querySelectorAll("[data-remove-date]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const val = btn.getAttribute("data-remove-date");
          const i = selectedDates.indexOf(val);
          if (i >= 0) selectedDates.splice(i, 1);
          renderDateChips();
          updateQuote(selectedDates, loadPricing());
        });
      });
      updateQuote(selectedDates, loadPricing());
    }

    if (dateAdd) dateAdd.min = todayStr();

    if (btnAddDate && dateAdd) {
      btnAddDate.addEventListener("click", () => {
        const v = dateAdd.value;
        if (!v) {
          showToast("请先选择日期");
          return;
        }
        if (v < todayStr()) {
          showToast("不能选择过去的日期");
          return;
        }
        if (!selectedDates.includes(v)) {
          selectedDates.push(v);
          selectedDates.sort();
        }
        dateAdd.value = "";
        renderDateChips();
      });
    }

    const quoteInputs = [
      "f-cats",
      "f-duration",
      "f-pills",
      "f-injections",
      "f-brush",
      "f-ear",
      "f-bath",
      "f-km",
    ];
    quoteInputs.forEach((id) => {
      document.getElementById(id)?.addEventListener("input", () => updateQuote(selectedDates, loadPricing()));
      document.getElementById(id)?.addEventListener("change", () => updateQuote(selectedDates, loadPricing()));
    });

    renderDateChips();

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("f-name")?.value?.trim();
        const phone = document.getElementById("f-phone")?.value?.trim();
        const address = document.getElementById("f-address")?.value?.trim();
        const catCount = document.getElementById("f-cats")?.value;
        const catNames = document.getElementById("f-cat-names")?.value?.trim() || "";
        const note = document.getElementById("f-note")?.value?.trim() || "";
        const durationId = document.getElementById("f-duration")?.value;

        if (!name) {
          showToast("请填写姓名");
          return;
        }
        if (!/^1\d{10}$/.test(phone || "")) {
          showToast("请填写正确手机号");
          return;
        }
        if (!address) {
          showToast("请填写详细地址");
          return;
        }
        const cats = parseInt(catCount, 10);
        if (!cats || cats < 1) {
          showToast("猫咪数量至少为 1");
          return;
        }
        if (!selectedDates.length) {
          showToast("请添加至少一个预约日期");
          return;
        }
        if (!durationId) {
          showToast("请选择服务时长");
          return;
        }

        const dates = [...selectedDates].sort();
        const extras = {
          pills: Math.max(0, parseInt(document.getElementById("f-pills")?.value, 10) || 0),
          injections: Math.max(0, parseInt(document.getElementById("f-injections")?.value, 10) || 0),
          brush: !!document.getElementById("f-brush")?.checked,
          ear: !!document.getElementById("f-ear")?.checked,
          bath: !!document.getElementById("f-bath")?.checked,
        };
        const km = Math.max(0, parseFloat(document.getElementById("f-km")?.value) || 0);
        const quoteTotal = orderAmount(
          { catCount: cats, dates, durationId, extras, km },
          loadPricing()
        );

        const orders = loadOrders();
        orders.unshift({
          id: uid(),
          name,
          phone,
          address,
          catCount: cats,
          catNames,
          dates,
          durationId,
          extras,
          km,
          quoteTotal,
          note,
          status: "pending",
          photos: [],
          createdAt: new Date().toISOString(),
        });
        saveOrders(orders);
        form.reset();
        const pillsEl = document.getElementById("f-pills");
        const injEl = document.getElementById("f-injections");
        const kmEl = document.getElementById("f-km");
        if (pillsEl) pillsEl.value = "0";
        if (injEl) injEl.value = "0";
        if (kmEl) kmEl.value = "0";
        ["f-brush", "f-ear", "f-bath"].forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.checked = false;
        });
        selectedDates.length = 0;
        renderDateChips();
        if (dateAdd) dateAdd.min = todayStr();
        updateQuote(selectedDates, loadPricing());
        showToast("提交成功！请加微信确认订单");
      });
    }

    const navToggle = document.getElementById("nav-toggle");
    const navPanel = document.getElementById("nav-panel");
    if (navToggle && navPanel) {
      navToggle.addEventListener("click", () => {
        navPanel.classList.toggle("hidden");
      });
      navPanel.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => navPanel.classList.add("hidden"));
      });
    }
  }

  /** ---------- Featured admin ---------- */
  function readFeaturedFromDom() {
    const mount = document.getElementById("featured-admin-mount");
    if (!mount) return loadFeatured();
    const rows = mount.querySelectorAll("[data-feature-id]");
    if (!rows.length) return [];
    return Array.from(rows).map((row) => ({
      id: row.getAttribute("data-feature-id") || uid(),
      title: row.querySelector(".feat-title")?.value?.trim() || "",
      desc: row.querySelector(".feat-desc")?.value?.trim() || "",
      image: row.querySelector(".feat-img-data")?.value?.trim() || "",
      show: !!row.querySelector(".feat-show")?.checked,
    }));
  }

  function renderFeaturedAdmin() {
    const mount = document.getElementById("featured-admin-mount");
    if (!mount) return;
    const items = loadFeatured();
    mount.innerHTML = "";
    if (!items.length) {
      mount.innerHTML = '<p class="text-sm text-stone-500">暂无条目，点击「添加一条」。</p>';
      return;
    }

    items.forEach((it) => {
      const row = document.createElement("div");
      row.setAttribute("data-feature-id", it.id);
      row.className = "rounded-2xl border border-pink-100 bg-white/90 p-4 space-y-3";

      const thumb = document.createElement("div");
      thumb.className =
        "shrink-0 w-24 h-24 rounded-xl border border-pink-100 overflow-hidden bg-pink-50 flex items-center justify-center text-xs text-stone-400";
      if (it.image) {
        const im = document.createElement("img");
        im.src = it.image;
        im.className = "w-full h-full object-cover";
        im.alt = "";
        thumb.appendChild(im);
      } else {
        thumb.textContent = "无图";
      }

      const right = document.createElement("div");
      right.className = "flex-1 min-w-[200px] space-y-2";

      const lbTitle = document.createElement("label");
      lbTitle.className = "block space-y-1";
      lbTitle.innerHTML = '<span class="text-[10px] text-stone-500">标题</span>';
      const inTitle = document.createElement("input");
      inTitle.type = "text";
      inTitle.className = "input-field py-2 text-sm feat-title";
      inTitle.value = it.title || "";
      lbTitle.appendChild(inTitle);

      const lbDesc = document.createElement("label");
      lbDesc.className = "block space-y-1";
      lbDesc.innerHTML = '<span class="text-[10px] text-stone-500">介绍</span>';
      const ta = document.createElement("textarea");
      ta.className = "input-field py-2 text-sm feat-desc resize-y min-h-[72px]";
      ta.rows = 3;
      ta.value = it.desc || "";
      lbDesc.appendChild(ta);

      const hidden = document.createElement("input");
      hidden.type = "hidden";
      hidden.className = "feat-img-data";
      hidden.value = it.image || "";

      const actions = document.createElement("div");
      actions.className = "flex flex-wrap items-center gap-3";

      const lbShow = document.createElement("label");
      lbShow.className = "inline-flex items-center gap-2 text-sm cursor-pointer";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "feat-show rounded border-pink-300 text-pink-600";
      cb.checked = !!it.show;
      lbShow.appendChild(cb);
      lbShow.appendChild(document.createTextNode("前台展示"));

      const lbFile = document.createElement("label");
      lbFile.className = "text-xs text-pink-700 cursor-pointer border border-pink-200 rounded-lg px-2 py-1 hover:bg-pink-50";
      lbFile.textContent = "上传图片 ";
      const file = document.createElement("input");
      file.type = "file";
      file.accept = "image/*";
      file.className = "hidden feat-file";
      lbFile.appendChild(file);

      const btnRm = document.createElement("button");
      btnRm.type = "button";
      btnRm.className = "text-xs text-red-600 hover:underline feat-remove";
      btnRm.textContent = "删除本条";

      actions.appendChild(lbShow);
      actions.appendChild(lbFile);
      actions.appendChild(btnRm);

      right.appendChild(lbTitle);
      right.appendChild(lbDesc);
      right.appendChild(hidden);
      right.appendChild(actions);

      const flex = document.createElement("div");
      flex.className = "flex flex-wrap gap-3 items-start";
      flex.appendChild(thumb);
      flex.appendChild(right);
      row.appendChild(flex);
      mount.appendChild(row);

      const fid = it.id;
      const previewBox = thumb;
      file.addEventListener("change", (e) => {
        const f = e.target.files?.[0];
        if (!f || !f.type.startsWith("image/")) return;
        if (f.size > 900 * 1024) {
          showToast("图片请小于约 900KB");
          e.target.value = "";
          return;
        }
        const r = new FileReader();
        r.onload = () => {
          const data = r.result;
          if (typeof data === "string") hidden.value = data;
          if (typeof data === "string") {
            previewBox.innerHTML = "";
            const im = document.createElement("img");
            im.src = data;
            im.className = "w-full h-full object-cover";
            im.alt = "";
            previewBox.appendChild(im);
          }
        };
        r.readAsDataURL(f);
        e.target.value = "";
      });

      btnRm.addEventListener("click", () => {
        const list = loadFeatured().filter((x) => x.id !== fid);
        saveFeatured(list);
        renderFeaturedAdmin();
      });
    });
  }

  /** ---------- 后台 admin ---------- */
  function fillAdminForm() {
    const pub = loadPublicProfile();
    const p = mergePricing(loadPricing());
    const w = loadWechat();

    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val != null ? val : "";
    };

    set("adm-site-name", pub.siteName);
    set("adm-hero-line1", pub.heroLine1);
    set("adm-hero-highlight", pub.heroHighlight);
    set("adm-hero-desc", pub.heroDesc);
    set("adm-intro-note-title", pub.introNoteTitle);
    set("adm-intro-note", pub.introNote);
    set("adm-service-standards", pub.serviceStandards || "");
    set("adm-self-intro", pub.selfIntro || "");
    set("adm-footer-scope-title", pub.footerScopeTitle);
    set("adm-footer-scope", pub.footerScope);
    set("adm-footer-faq-title", pub.footerFaqTitle);
    set("adm-footer-faq-lines", pub.footerFaqLines);
    set("adm-footer-promise-title", pub.footerPromiseTitle);
    set("adm-footer-promise-lines", pub.footerPromiseLines);
    set("adm-poster-bottom", pub.posterBottomLine);

    pub.services.forEach((it, i) => {
      set(`adm-svc-icon-${i}`, it.icon);
      set(`adm-svc-title-${i}`, it.title);
      set(`adm-svc-desc-${i}`, it.desc);
    });

    set("adm-price-base-label", p.baseLabel);
    set("adm-price-base", p.basePrice);
    set("adm-price-extra-label", p.extraCatLabel);
    set("adm-price-extra", p.extraCatPrice);
    set("adm-price-holiday", p.holidayNote);

    for (let i = 0; i < 4; i++) {
      const d = p.durations[i];
      set(`adm-dur-label-${i}`, d?.label || "");
      set(`adm-dur-extra-${i}`, d != null && d.extra != null ? d.extra : "");
    }

    set("adm-addon-pill-label", p.addonPillLabel);
    set("adm-addon-pill-price", p.addonPillPrice);
    set("adm-addon-inj-label", p.addonInjectionLabel);
    set("adm-addon-inj-price", p.addonInjectionPrice);
    set("adm-addon-brush-label", p.addonBrushLabel);
    set("adm-addon-brush-price", p.addonBrushPrice);
    set("adm-addon-ear-label", p.addonEarLabel);
    set("adm-addon-ear-price", p.addonEarPrice);
    set("adm-addon-bath-label", p.addonBathLabel);
    set("adm-addon-bath-price", p.addonBathPrice);
    set("adm-km-label", p.kmLabel);
    set("adm-km-price", p.kmPrice);

    set("adm-wechat", w);
    renderFeaturedAdmin();
  }

  function readAdminPublicProfile() {
    const get = (id) => document.getElementById(id)?.value ?? "";
    const d = defaultPublicProfile();
    const services = [];
    for (let i = 0; i < 4; i++) {
      services.push({
        icon: get(`adm-svc-icon-${i}`).trim() || d.services[i].icon,
        title: get(`adm-svc-title-${i}`).trim() || d.services[i].title,
        desc: get(`adm-svc-desc-${i}`).trim() || d.services[i].desc,
      });
    }
    return {
      siteName: get("adm-site-name").trim() || d.siteName,
      heroLine1: get("adm-hero-line1").trim() || d.heroLine1,
      heroHighlight: get("adm-hero-highlight").trim() || d.heroHighlight,
      heroDesc: get("adm-hero-desc").trim() || d.heroDesc,
      introNoteTitle: get("adm-intro-note-title").trim() || d.introNoteTitle,
      introNote: get("adm-intro-note").trim() || d.introNote,
      serviceStandards: get("adm-service-standards").trim() || d.serviceStandards,
      selfIntro: get("adm-self-intro").trim() || d.selfIntro,
      footerScopeTitle: get("adm-footer-scope-title").trim() || d.footerScopeTitle,
      footerScope: get("adm-footer-scope").trim() || d.footerScope,
      footerFaqTitle: get("adm-footer-faq-title").trim() || d.footerFaqTitle,
      footerFaqLines: get("adm-footer-faq-lines").trim() || d.footerFaqLines,
      footerPromiseTitle: get("adm-footer-promise-title").trim() || d.footerPromiseTitle,
      footerPromiseLines: get("adm-footer-promise-lines").trim() || d.footerPromiseLines,
      posterBottomLine: get("adm-poster-bottom").trim() || d.posterBottomLine,
      services,
    };
  }

  function readAdminPricing() {
    const get = (id) => document.getElementById(id)?.value ?? "";
    const d = defaultPricing();
    const durations = [];
    for (let i = 0; i < 4; i++) {
      const label = get(`adm-dur-label-${i}`).trim();
      if (!label) continue;
      durations.push({
        id: `dur_${i}`,
        label,
        extra: Math.max(0, parseFloat(get(`adm-dur-extra-${i}`)) || 0),
      });
    }
    const durFinal = durations.length ? durations : [...d.durations];

    return {
      baseLabel: get("adm-price-base-label").trim() || d.baseLabel,
      basePrice: Math.max(0, parseFloat(get("adm-price-base")) || 0),
      extraCatLabel: get("adm-price-extra-label").trim() || d.extraCatLabel,
      extraCatPrice: Math.max(0, parseFloat(get("adm-price-extra")) || 0),
      holidayNote: get("adm-price-holiday").trim() || "",
      durations: durFinal,
      addonPillLabel: get("adm-addon-pill-label").trim() || d.addonPillLabel,
      addonPillPrice: Math.max(0, parseFloat(get("adm-addon-pill-price")) || 0),
      addonInjectionLabel: get("adm-addon-inj-label").trim() || d.addonInjectionLabel,
      addonInjectionPrice: Math.max(0, parseFloat(get("adm-addon-inj-price")) || 0),
      addonBrushLabel: get("adm-addon-brush-label").trim() || d.addonBrushLabel,
      addonBrushPrice: Math.max(0, parseFloat(get("adm-addon-brush-price")) || 0),
      addonEarLabel: get("adm-addon-ear-label").trim() || d.addonEarLabel,
      addonEarPrice: Math.max(0, parseFloat(get("adm-addon-ear-price")) || 0),
      addonBathLabel: get("adm-addon-bath-label").trim() || d.addonBathLabel,
      addonBathPrice: Math.max(0, parseFloat(get("adm-addon-bath-price")) || 0),
      kmLabel: get("adm-km-label").trim() || d.kmLabel,
      kmPrice: Math.max(0, parseFloat(get("adm-km-price")) || 0),
    };
  }

  function persistAdminSettingsSilent() {
    const pub = readAdminPublicProfile();
    const pricing = readAdminPricing();
    const wechat = document.getElementById("adm-wechat")?.value?.trim() || defaultWechat();
    savePublicProfile(pub);
    savePricing(pricing);
    saveWechat(wechat);
    saveFeatured(readFeaturedFromDom());
  }

  function saveAllAdminSettings() {
    persistAdminSettingsSilent();
    showToast("已保存全部配置（含特色商品）");
  }

  function buildPosterElement(pub, pricing, wechat) {
    const wrap = document.createElement("div");
    wrap.id = "work-poster-canvas";
    const pr = mergePricing(pricing);
    const svcLines = pub.services
      .slice(0, 4)
      .map(
        (s) =>
          `<div style="display:flex;gap:10px;margin-bottom:10px;font-size:24px;line-height:1.35;color:#5c4552;"><span>${escapeHtml(s.icon)}</span><div><strong style="color:#9d174d;">${escapeHtml(s.title)}</strong><div style="font-size:20px;font-weight:500;margin-top:2px;">${escapeHtml(s.desc)}</div></div></div>`
      )
      .join("");

    const stdText = (pub.serviceStandards || "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => `<p style="margin:0 0 6px;font-size:20px;color:#5c4552;line-height:1.45;">• ${escapeHtml(l)}</p>`)
      .join("");

    const durHint = pr.durations.map((d) => `${escapeHtml(d.label)}${d.extra > 0 ? " +" + d.extra + "元" : ""}`).join(" · ");

    const addonHint = `${escapeHtml(pr.addonPillLabel)} ¥${pr.addonPillPrice}/粒 · ${escapeHtml(pr.addonInjectionLabel)} ¥${pr.addonInjectionPrice}/针 · ${escapeHtml(pr.addonBrushLabel)} ¥${pr.addonBrushPrice} · ${escapeHtml(pr.addonEarLabel)} ¥${pr.addonEarPrice} · ${escapeHtml(pr.addonBathLabel)} ¥${pr.addonBathPrice}`;

    wrap.innerHTML = `
      <div class="poster-deco">🐱</div>
      <div style="text-align:center;margin-bottom:22px;">
        <div style="font-size:40px;margin-bottom:10px;">🐾</div>
        <h2 style="margin:0;font-size:48px;font-weight:800;color:#be185d;letter-spacing:-1px;">${escapeHtml(pub.siteName)}</h2>
        <p style="margin:14px 0 0;font-size:28px;color:#7c3e5c;line-height:1.4;">${escapeHtml(pub.heroLine1)}<br/><span style="color:#db2777;font-weight:700;">${escapeHtml(pub.heroHighlight)}</span></p>
      </div>
      <div style="background:rgba(255,255,255,0.92);border-radius:20px;padding:20px 18px;border:2px solid #fbcfe8;margin-bottom:16px;">
        <p style="margin:0 0 10px;font-size:24px;font-weight:700;color:#9d174d;">服务内容</p>
        ${svcLines}
      </div>
      <div style="background:#fff;border-radius:20px;padding:18px;border:2px solid #f9a8d4;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#be185d;">服务标准</p>
        ${stdText || `<p style="font-size:20px;color:#8b6b7a;">请在后台填写服务标准，便于宠主了解流程。</p>`}
      </div>
      <div style="background:linear-gradient(135deg,#fce7f3,#fff);border-radius:20px;padding:18px;border:2px solid #f9a8d4;margin-bottom:16px;">
        <p style="margin:0 0 8px;font-size:24px;font-weight:800;color:#be185d;">关于我</p>
        <p style="margin:0;font-size:22px;color:#5c4552;line-height:1.5;white-space:pre-wrap;">${escapeHtml(pub.selfIntro || "")}</p>
      </div>
      <div style="background:linear-gradient(135deg,#fce7f3,#fff);border-radius:20px;padding:18px;border:2px solid #f9a8d4;margin-bottom:16px;">
        <p style="margin:0 0 10px;font-size:26px;font-weight:800;color:#be185d;">价格参考</p>
        <p style="margin:0;font-size:22px;color:#5c4552;line-height:1.45;">
          ${escapeHtml(pr.baseLabel)}：<strong style="color:#db2777;">¥${pr.basePrice}</strong> · ${escapeHtml(pr.extraCatLabel)} <strong style="color:#db2777;">+¥${pr.extraCatPrice}</strong><br/>
          时长：${durHint}<br/>
          增项：${addonHint}<br/>
          ${escapeHtml(pr.kmLabel)}：<strong style="color:#db2777;">¥${pr.kmPrice}/km</strong>（整单）
        </p>
        ${pr.holidayNote ? `<p style="margin:10px 0 0;font-size:20px;color:#a16207;background:#fffbeb;padding:8px 10px;border-radius:12px;">${escapeHtml(pr.holidayNote)}</p>` : ""}
      </div>
      <div style="text-align:center;padding:16px;border-radius:18px;background:#fff;border:2px dashed #f472b6;">
        <p style="margin:0;font-size:22px;color:#8b6b7a;">预约微信</p>
        <p style="margin:6px 0 0;font-size:34px;font-weight:800;color:#db2777;word-break:break-all;">${escapeHtml(wechat)}</p>
      </div>
      <p style="text-align:center;margin-top:18px;font-size:20px;color:#a78b96;">${escapeHtml(pub.posterBottomLine)}</p>
    `;
    return wrap;
  }

  function initAdmin() {
    const lockEl = document.getElementById("admin-lock");
    const pwdInput = document.getElementById("lock-password");
    const submitBtn = document.getElementById("lock-submit");
    const errorMsg = document.getElementById("lock-error");

    function checkPassword() {
      const savedPwd = localStorage.getItem(STORAGE_ADMIN_PASSWORD);
      const inputPwd = pwdInput?.value?.trim() || "";
      if (!savedPwd) {
        if (inputPwd.length < 4) {
          if (errorMsg) errorMsg.textContent = "密码至少4位";
          if (errorMsg) errorMsg.classList.remove("hidden");
          return false;
        }
        localStorage.setItem(STORAGE_ADMIN_PASSWORD, inputPwd);
        if (lockEl) lockEl.style.display = "none";
        return true;
      }
      if (inputPwd === savedPwd) {
        if (lockEl) lockEl.style.display = "none";
        return true;
      }
      if (errorMsg) errorMsg.textContent = "密码错误，请重试";
      if (errorMsg) errorMsg.classList.remove("hidden");
      return false;
    }

    if (localStorage.getItem(STORAGE_ADMIN_PASSWORD)) {
      if (errorMsg) errorMsg.classList.add("hidden");
    } else {
      if (errorMsg) errorMsg.textContent = "首次访问请设置密码";
      if (errorMsg) errorMsg.classList.remove("hidden");
    }

    if (submitBtn) submitBtn.addEventListener("click", checkPassword);
    if (pwdInput) {
      pwdInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") checkPassword();
      });
    }

    const savedPwd = localStorage.getItem(STORAGE_ADMIN_PASSWORD);
    if (savedPwd) {
      if (lockEl) lockEl.style.display = "flex";
      if (pwdInput) pwdInput.value = "";
    } else {
      if (lockEl) lockEl.style.display = "flex";
      if (pwdInput) pwdInput.value = "";
      if (errorMsg) errorMsg.textContent = "首次访问请设置密码";
      if (errorMsg) errorMsg.classList.remove("hidden");
    }

    fillAdminForm();

    document.getElementById("btn-featured-add")?.addEventListener("click", () => {
      const list = loadFeatured();
      list.push({ id: uid(), title: "", desc: "", image: "", show: true });
      saveFeatured(list);
      renderFeaturedAdmin();
    });

    const filterEl = document.getElementById("filter-status");
    const listEl = document.getElementById("order-list");
    const btnExport = document.getElementById("btn-export");
    const btnClear = document.getElementById("btn-clear-all");
    const btnSaveSettings = document.getElementById("btn-save-settings");
    const btnPoster = document.getElementById("btn-gen-poster");
    const btnPosterClose = document.getElementById("btn-poster-close");
    const btnPosterDownload = document.getElementById("btn-poster-download");
    const posterModal = document.getElementById("poster-modal");
    const posterPreview = document.getElementById("poster-preview-mount");

    if (btnSaveSettings) btnSaveSettings.addEventListener("click", saveAllAdminSettings);

    function stats() {
      const orders = loadOrders();
      const pricing = loadPricing();
      const counts = { all: orders.length, pending: 0, accepted: 0, completed: 0, cancelled: 0 };
      let revenue = 0;
      for (const o of orders) {
        if (counts[o.status] !== undefined) counts[o.status]++;
        if (o.status !== "cancelled") revenue += orderAmount(o, pricing);
      }
      return { orders, pricing, counts, revenue };
    }

    function renderStats() {
      const { counts, revenue } = stats();
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = v;
      };
      set("stat-total", counts.all);
      set("stat-pending", counts.pending);
      set("stat-accepted", counts.accepted);
      set("stat-completed", counts.completed);
      set("stat-revenue", "¥" + revenue.toFixed(0));
    }

    function statusLabel(s) {
      const map = {
        pending: "待确认",
        accepted: "已接单",
        completed: "已完成",
        cancelled: "已取消",
      };
      return map[s] || s;
    }

    function formatDatesLine(o) {
      const ds = orderDates(o);
      if (!ds.length) return "—";
      if (ds.length <= 3) return ds.join("、");
      return `${ds.slice(0, 3).join("、")} 等 ${ds.length} 天`;
    }

    function extrasSummary(o, pricing) {
      const ex = o.extras || {};
      const pr = mergePricing(pricing);
      const parts = [];
      if (ex.pills) parts.push(`${pr.addonPillLabel}×${ex.pills}`);
      if (ex.injections) parts.push(`${pr.addonInjectionLabel}×${ex.injections}`);
      if (ex.brush) parts.push(pr.addonBrushLabel);
      if (ex.ear) parts.push(pr.addonEarLabel);
      if (ex.bath) parts.push(pr.addonBathLabel);
      if (o.km) parts.push(`路程${o.km}km`);
      return parts.length ? parts.join("，") : "无增项";
    }

    function renderList() {
      const filter = filterEl?.value || "all";
      let orders = loadOrders();
      if (filter !== "all") orders = orders.filter((o) => o.status === filter);

      if (!listEl) return;
      if (!orders.length) {
        listEl.innerHTML =
          '<p class="text-center text-stone-500 py-12">暂无订单。分享前台链接给客户下单吧 🐾</p>';
        return;
      }

      const pricing = loadPricing();

      listEl.innerHTML = orders
        .map((o) => {
          const amt = orderAmount(o, pricing);
          const per = singleVisitAmount(o, pricing);
          const days = Math.max(1, orderDates(o).length);
          const photos = Array.isArray(o.photos) ? o.photos : [];
          const thumbs = photos
            .map(
              (src, i) =>
                `<img src="${src}" alt="" class="h-16 w-16 rounded-lg object-cover border border-pink-100 cursor-pointer" data-full="${encodeURIComponent(src)}" data-oid="${o.id}" data-idx="${i}"/>`
            )
            .join("");

          const actions =
            o.status === "pending"
              ? `<button type="button" class="rounded-xl bg-pink-500 px-3 py-1.5 text-sm text-white hover:bg-pink-600" data-act="accept" data-id="${o.id}">接单</button>
                 <button type="button" class="rounded-xl border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50" data-act="cancel" data-id="${o.id}">取消</button>`
              : o.status === "accepted"
                ? `<button type="button" class="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm text-white hover:bg-emerald-600" data-act="complete" data-id="${o.id}">完成</button>
                   <button type="button" class="rounded-xl border border-stone-200 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50" data-act="cancel" data-id="${o.id}">取消</button>`
                : `<span class="text-sm text-stone-400">—</span>`;

          const delBtn = `<button type="button" class="rounded-xl border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50" data-act="delete" data-id="${o.id}">删除</button>`;

          const datesHtml = orderDates(o)
            .map((d) => `<span class="inline-block mr-1 mb-1 rounded-lg bg-pink-50 px-2 py-0.5 text-xs text-pink-800">${escapeHtml(d)}</span>`)
            .join("");

          const durLine = escapeHtml(durationLabel(o, pricing));
          const exLine = escapeHtml(extrasSummary(o, pricing));

          return `
          <article class="card-soft rounded-2xl p-4 md:p-5 space-y-3" data-order-id="${o.id}">
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <span class="inline-block rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-700">${statusLabel(o.status)}</span>
                <h3 class="mt-1 text-lg font-bold text-stone-800">${escapeHtml(o.name)}</h3>
                <p class="text-sm text-stone-600 mt-1">📞 ${escapeHtml(o.phone)}</p>
              </div>
              <div class="text-right text-sm">
                <div class="text-pink-600 font-semibold">预估 ¥${amt.toFixed(0)}</div>
                <div class="text-[11px] text-stone-400">${days} 天 · 单次上门约 ¥${per.toFixed(0)}</div>
                <div class="text-stone-500 text-xs mt-1 max-w-[200px]">${formatDatesLine(o)}</div>
              </div>
            </div>
            <div>
              <p class="text-xs text-stone-500 mb-1">预约日期</p>
              <div class="flex flex-wrap">${datesHtml || "—"}</div>
            </div>
            <p class="text-sm text-stone-700"><span class="text-stone-500">时长：</span>${durLine}</p>
            <p class="text-sm text-stone-700"><span class="text-stone-500">增项：</span>${exLine}</p>
            <p class="text-sm text-stone-700"><span class="text-stone-500">地址：</span>${escapeHtml(o.address)}</p>
            <p class="text-sm text-stone-700"><span class="text-stone-500">猫咪：</span>${o.catCount} 只${o.catNames ? '（' + escapeHtml(o.catNames) + '）' : ''}</p>
            ${o.note ? `<p class="text-sm text-stone-600 bg-pink-50/80 rounded-xl px-3 py-2"><span class="text-stone-500">备注：</span>${escapeHtml(o.note)}</p>` : ""}
            <div class="flex flex-wrap gap-2 items-center">
              ${actions}
              ${delBtn}
            </div>
            <div class="border-t border-pink-100 pt-3">
              <label class="block text-xs font-medium text-stone-500 mb-2">服务照片（存于本地）</label>
              <div class="thumb-grid mb-2">${thumbs || '<span class="text-xs text-stone-400 col-span-full">暂无照片</span>'}</div>
              <input type="file" accept="image/*" multiple class="text-sm text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-pink-100 file:px-3 file:py-1.5 file:text-pink-800" data-upload="${o.id}" />
            </div>
          </article>`;
        })
        .join("");

      listEl.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", onOrderAction);
      });
      listEl.querySelectorAll("[data-upload]").forEach((inp) => {
        inp.addEventListener("change", onUpload);
      });
      listEl.querySelectorAll("img[data-full]").forEach((img) => {
        img.addEventListener("click", () => {
          const u = decodeURIComponent(img.getAttribute("data-full") || "");
          if (u) window.open(u, "_blank");
        });
      });
    }

    function onOrderAction(e) {
      const btn = e.currentTarget;
      const id = btn.getAttribute("data-id");
      const act = btn.getAttribute("data-act");
      if (!id || !act) return;
      let orders = loadOrders();
      const o = orders.find((x) => x.id === id);
      if (!o) return;

      if (act === "delete") {
        if (!confirm("确定删除该订单？不可恢复。")) return;
        orders = orders.filter((x) => x.id !== id);
      } else if (act === "accept") o.status = "accepted";
      else if (act === "complete") o.status = "completed";
      else if (act === "cancel") o.status = "cancelled";

      saveOrders(orders);
      renderStats();
      renderList();
      renderCalendar();
      showToast("已更新");
    }

    function onUpload(e) {
      const input = e.currentTarget;
      const id = input.getAttribute("data-upload");
      const files = Array.from(input.files || []);
      input.value = "";
      if (!id || !files.length) return;

      const orders = loadOrders();
      const o = orders.find((x) => x.id === id);
      if (!o) return;
      if (!Array.isArray(o.photos)) o.photos = [];

      const maxPerOrder = 24;
      const maxSize = 1.2 * 1024 * 1024;
      const room = maxPerOrder - o.photos.length;
      if (room <= 0) {
        showToast("该订单照片已达上限");
        return;
      }

      const toRead = files
        .filter((f) => f.type.startsWith("image/") && f.size <= maxSize)
        .slice(0, room);

      if (!toRead.length) {
        showToast("请选图片文件，单张不超过约 1.2MB");
        return;
      }

      Promise.all(
        toRead.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = () => reject(new Error("read"));
              reader.readAsDataURL(file);
            })
        )
      )
        .then((results) => {
          for (const data of results) {
            if (typeof data === "string") o.photos.push(data);
          }
          saveOrders(orders);
          renderList();
          showToast("照片已保存到该订单");
        })
        .catch(() => showToast("读取图片失败，请重试"));
    }

    if (filterEl) filterEl.addEventListener("change", renderList);

    if (btnExport) {
      btnExport.addEventListener("click", () => {
        const payload = {
          exportedAt: new Date().toISOString(),
          publicProfile: loadPublicProfile(),
          pricing: loadPricing(),
          wechat: loadWechat(),
          featured: loadFeatured(),
          orders: loadOrders(),
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "cat-sitter-backup-" + new Date().toISOString().slice(0, 10) + ".json";
        a.click();
        URL.revokeObjectURL(a.href);
        showToast("已导出 JSON 备份");
      });
    }

    if (btnClear) {
      btnClear.addEventListener("click", () => {
        if (!confirm("确定清空所有本地订单与宠托师配置？此操作不可恢复。")) return;
        localStorage.removeItem(STORAGE_ORDERS);
        localStorage.removeItem(STORAGE_PRICING);
        localStorage.removeItem(STORAGE_WECHAT);
        localStorage.removeItem(STORAGE_PUBLIC);
        localStorage.removeItem(STORAGE_FEATURED);
        fillAdminForm();
        renderStats();
        renderList();
        renderCalendar();
        showToast("已清空");
      });
    }

    let posterNode = null;

    function openPosterModal() {
      persistAdminSettingsSilent();
      const pub = loadPublicProfile();
      const pricing = loadPricing();
      const wechat = loadWechat();
      if (posterPreview) {
        posterPreview.innerHTML = "";
        posterNode = buildPosterElement(pub, pricing, wechat);
        posterPreview.appendChild(posterNode);
      }
      if (posterModal) {
        posterModal.classList.remove("hidden");
        posterModal.setAttribute("aria-hidden", "false");
      }
    }

    function closePosterModal() {
      if (posterModal) {
        posterModal.classList.add("hidden");
        posterModal.setAttribute("aria-hidden", "true");
      }
      if (posterPreview) posterPreview.innerHTML = "";
      posterNode = null;
    }

    async function downloadPoster() {
      if (typeof html2canvas !== "function") {
        showToast("简介图库加载失败，请检查网络后重试");
        return;
      }
      const pub = loadPublicProfile();
      const pricing = loadPricing();
      const wechat = loadWechat();
      const node = buildPosterElement(pub, pricing, wechat);
      node.style.position = "fixed";
      node.style.left = "-10000px";
      node.style.top = "0";
      document.body.appendChild(node);
      try {
        const canvas = await html2canvas(node, {
          scale: 2,
          useCORS: true,
          backgroundColor: "#fff5f7",
          logging: false,
        });
        canvas.toBlob((blob) => {
          if (!blob) {
            showToast("生成图片失败");
            return;
          }
          const a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = `工作简介-${pub.siteName || "喵伴"}-${new Date().toISOString().slice(0, 10)}.png`;
          a.click();
          URL.revokeObjectURL(a.href);
          showToast("已下载 PNG");
        }, "image/png");
      } catch {
        showToast("生成图片失败，请重试");
      } finally {
        document.body.removeChild(node);
      }
    }

    if (btnPoster) btnPoster.addEventListener("click", openPosterModal);
    if (btnPosterClose) btnPosterClose.addEventListener("click", closePosterModal);
    document.getElementById("btn-poster-close-2")?.addEventListener("click", closePosterModal);
    if (btnPosterDownload) btnPosterDownload.addEventListener("click", downloadPoster);
    if (posterModal) {
      posterModal.addEventListener("click", (e) => {
        if (e.target === posterModal) closePosterModal();
      });
    }

    let currentCalDate = new Date();

    function renderCalendar() {
      const year = currentCalDate.getFullYear();
      const month = currentCalDate.getMonth();
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      
      const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
      const dayNames = ["日", "一", "二", "三", "四", "五", "六"];
      
      const calMonthEl = document.getElementById("cal-month");
      if (calMonthEl) {
        calMonthEl.textContent = `${year}年${monthNames[month]}`;
      }
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startPadding = firstDay.getDay();
      const totalDays = lastDay.getDate();
      
      const orders = loadOrders();
      const ordersByDate = {};
      orders.forEach(order => {
        if (order.status !== "cancelled") {
          order.dates?.forEach(date => {
            if (!ordersByDate[date]) ordersByDate[date] = [];
            ordersByDate[date].push(order);
          });
        }
      });
      
      let html = '<div class="grid grid-cols-7 gap-1 mb-2">';
      dayNames.forEach(d => {
        html += `<div class="text-center text-xs font-medium text-stone-500 py-2">${d}</div>`;
      });
      html += '</div>';
      
      html += '<div class="grid grid-cols-7 gap-1">';
      
      for (let i = 0; i < startPadding; i++) {
        html += '<div class="min-h-[60px]"></div>';
      }
      
      for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayOrders = ordersByDate[dateStr] || [];
        const isToday = dateStr === todayStr;
        const isPast = dateStr < todayStr;
        
        let dayClasses = "min-h-[60px] p-1 rounded-lg border border-transparent hover:border-pink-200 hover:bg-pink-50/50 cursor-pointer transition-all";
        if (isToday) dayClasses += " bg-pink-100 border-pink-300";
        if (isPast) dayClasses += " opacity-50";
        
        html += `<div class="${dayClasses}" data-date="${dateStr}">`;
        html += `<div class="text-xs font-medium ${isToday ? 'text-pink-600' : 'text-stone-700'}">${day}</div>`;
        
        if (dayOrders.length > 0) {
          const acceptedCount = dayOrders.filter(o => o.status === "accepted").length;
          const pendingCount = dayOrders.filter(o => o.status === "pending").length;
          
          html += '<div class="mt-1 space-y-1">';
          dayOrders.slice(0, 3).forEach((order, idx) => {
            const addr = order.address?.replace(/小区|号楼|单元/g, '').slice(0, 6) || '未知地址';
            const statusClass = order.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-pink-100 text-pink-700";
            html += `<div class="text-[10px] px-1.5 py-0.5 rounded ${statusClass} truncate">${addr}</div>`;
          });
          if (dayOrders.length > 3) {
            html += `<div class="text-[10px] text-stone-500 text-center">+${dayOrders.length - 3}</div>`;
          }
          html += '</div>';
        }
        
        html += '</div>';
      }
      
      html += '</div>';
      
      const calGrid = document.getElementById("calendar-grid");
      if (calGrid) {
        calGrid.innerHTML = html;
        
        calGrid.querySelectorAll("[data-date]").forEach(cell => {
          cell.addEventListener("click", () => {
            const date = cell.getAttribute("data-date");
            showDayDetail(date);
          });
        });
      }
    }

    function showDayDetail(date) {
      const orders = loadOrders();
      const dayOrders = orders.filter(order => {
        return order.status !== "cancelled" && order.dates?.includes(date);
      });
      
      const titleEl = document.getElementById("cal-detail-title");
      const contentEl = document.getElementById("cal-detail-content");
      const detailEl = document.getElementById("cal-selected-detail");
      
      const dateObj = new Date(date);
      const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"];
      const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
      
      if (titleEl) {
        titleEl.textContent = `${dateObj.getFullYear()}年${monthNames[dateObj.getMonth()]}${dateObj.getDate()}日 ${dayNames[dateObj.getDay()]}`;
      }
      
      if (contentEl) {
        if (dayOrders.length === 0) {
          contentEl.innerHTML = '<p class="text-sm text-stone-500 text-center py-4">当日暂无行程安排</p>';
        } else {
          let html = '';
          dayOrders.forEach((order, idx) => {
            const statusText = order.status === "accepted" ? "已接单" : "待确认";
            const statusClass = order.status === "accepted" ? "bg-emerald-100 text-emerald-700" : "bg-pink-100 text-pink-700";
            const cats = order.catNames ? order.catNames : `${order.catCount}只猫`;
            
            html += `
              <div class="rounded-xl border border-pink-100 bg-white p-3 space-y-2">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex-1">
                    <p class="font-semibold text-stone-800">${order.contactName || '匿名'}</p>
                    <p class="text-sm text-stone-600">${order.address}</p>
                    <p class="text-xs text-stone-500 mt-1">${cats} · ${order.durationLabel || order.durationId}</p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded-full ${statusClass}">${statusText}</span>
                </div>
                ${order.note ? `<p class="text-xs text-stone-500 bg-pink-50 rounded-lg px-2 py-1">${order.note.slice(0, 50)}${order.note.length > 50 ? '...' : ''}</p>` : ''}
              </div>
            `;
          });
          contentEl.innerHTML = html;
        }
      }
      
      if (detailEl) {
        detailEl.classList.remove("hidden");
        detailEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    const btnPrev = document.getElementById("cal-prev");
    const btnNext = document.getElementById("cal-next");
    const btnToday = document.getElementById("cal-today");
    
    if (btnPrev) {
      btnPrev.addEventListener("click", () => {
        currentCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1);
        renderCalendar();
      });
    }
    
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        currentCalDate = new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1);
        renderCalendar();
      });
    }
    
    if (btnToday) {
      btnToday.addEventListener("click", () => {
        currentCalDate = new Date();
        renderCalendar();
        showDayDetail(new Date().toISOString().slice(0, 10));
      });
    }

    renderStats();
    renderList();
    renderCalendar();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body?.getAttribute("data-page");
    if (page === "index") initIndex();
    else if (page === "admin") initAdmin();
  });
})();
