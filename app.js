(() => {
  const payload = window.SATOSHI_TIMELINE_DATA || { events: [] };
  const allEvents = payload.events.map((event) => ({ ...event, dateObj: new Date(event.date) }));
  const colors = {
    "Email": "Email",
    "BitcoinTalk": "BitcoinTalk",
    "Whitepaper": "Whitepaper",
    "Cryptography Mailing List": "Cryptography",
    "SourceForge / Bitcoin list": "SourceForge",
    "P2P Foundation": "P2P",
    "Other": "Other"
  };
  const state = { query: "", categories: new Set(), maxYear: 2014 };
  const $ = (sel) => document.querySelector(sel);
  const list = $("#timelineList");
  const resultCount = $("#resultCount");
  const dialog = $("#quoteDialog");
  const dialogBody = $("#dialogBody");

  function categoryCounts(events) {
    return events.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {});
  }

  function renderStats() {
    const counts = categoryCounts(allEvents);
    const first = allEvents[0]?.short_date || "";
    const last = allEvents[allEvents.length - 1]?.short_date || "";
    const top = Object.entries(counts).sort((a,b) => b[1] - a[1])[0];
    $("#stats").innerHTML = [
      [allEvents.length.toLocaleString(), "timeline entries"],
      [`${first} → ${last}`, "date range"],
      [Object.keys(counts).length, "source groups"],
      [top ? `${top[1]} ${top[0]}` : "", "largest group"]
    ].map(([value,label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join("");
  }

  function renderFilters() {
    const counts = categoryCounts(allEvents);
    const filters = $("#filters");
    filters.innerHTML = Object.keys(counts).sort().map((cat) => {
      return `<button class="chip" type="button" data-category="${escapeHtml(cat)}" aria-pressed="false">${escapeHtml(cat)} · ${counts[cat]}</button>`;
    }).join("");
    filters.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-category]");
      if (!btn) return;
      const cat = btn.dataset.category;
      if (state.categories.has(cat)) state.categories.delete(cat); else state.categories.add(cat);
      btn.setAttribute("aria-pressed", state.categories.has(cat) ? "true" : "false");
      render();
    });
  }

  function filterEvents() {
    const q = state.query.toLowerCase().trim();
    return allEvents.filter((event) => {
      if (event.year > state.maxYear) return false;
      if (state.categories.size && !state.categories.has(event.category)) return false;
      if (!q) return true;
      return [event.title, event.source, event.category, event.excerpt, event.quote, event.short_date].join(" ").toLowerCase().includes(q);
    });
  }

  function renderTimelineGraphic(events) {
    const axis = $("#axis");
    const years = [...new Set(allEvents.map((event) => event.year))].filter(Boolean).sort((a,b) => a-b);
    const minTime = new Date(2008, 0, 1).getTime();
    const maxTime = new Date(2014, 11, 31).getTime();
    const width = Math.max(1800, years.length * 320);
    const xFor = (d) => 50 + ((d.getTime() - minTime) / (maxTime - minTime)) * (width - 100);
    const lane = {"Whitepaper": 38, "Email": 64, "Cryptography Mailing List": 90, "SourceForge / Bitcoin list": 116, "P2P Foundation": 142, "BitcoinTalk": 160, "Other": 76};
    const ticks = years.map(y => `<div class="year-tick" style="left:${50 + ((new Date(y,0,1).getTime()-minTime)/(maxTime-minTime))*(width-100)}px">${y}</div>`).join("");
    const dots = events.map((event) => {
      const cls = colors[event.category] || "Other";
      return `<button class="dot ${cls}" title="${escapeHtml(event.short_date + ' — ' + event.title)}" data-id="${event.id}" style="left:${xFor(event.dateObj)}px;top:${lane[event.category] || 100}px" aria-label="Open ${escapeHtml(event.title)}"></button>`;
    }).join("");
    axis.innerHTML = `<div class="axis-inner" style="width:${width}px"><div class="axis-line"></div>${ticks}${dots}</div>`;
    axis.onclick = (event) => {
      const dot = event.target.closest(".dot");
      if (dot) openEvent(dot.dataset.id);
    };

    const months = new Map();
    allEvents.forEach((event) => {
      if (!event.year || event.year > state.maxYear) return;
      const key = `${event.year}-${String(event.month).padStart(2,"0")}`;
      months.set(key, (months.get(key) || 0) + 1);
    });
    const max = Math.max(...months.values(), 1);
    $("#density").innerHTML = Array.from(months.entries()).sort().map(([key,count]) => `<div class="bar" title="${key}: ${count}" style="height:${Math.max(6,(count/max)*64)}px"><span>${count}</span></div>`).join("");
  }

  function renderCards(events) {
    let currentYear = null;
    const html = events.map((event) => {
      const divider = event.year !== currentYear ? (currentYear = event.year, `<li class="year-divider">${event.year}</li>`) : "";
      return divider + `<li class="card" data-id="${event.id}" data-category="${escapeHtml(event.category)}" tabindex="0">
        <div class="card-meta"><span>${escapeHtml(event.short_date)}</span><span class="badge">${escapeHtml(event.category)}</span><span>page ${event.page}</span></div>
        <h3>${escapeHtml(event.title)}</h3>
        <blockquote>${escapeHtml(event.excerpt || "[No extractable preview]")}</blockquote>
      </li>`;
    }).join("");
    list.innerHTML = html || `<li class="card"><h3>No matching events</h3><blockquote>Try clearing the search field, increasing the year range, or removing source filters.</blockquote></li>`;
  }

  function render() {
    const events = filterEvents();
    resultCount.textContent = `${events.length.toLocaleString()} of ${allEvents.length.toLocaleString()} entries shown`;
    renderTimelineGraphic(events);
    renderCards(events);
  }

  function openEvent(id) {
    const event = allEvents.find((item) => item.id === id);
    if (!event) return;
    dialogBody.innerHTML = `<article class="dialog-content">
      <p class="eyebrow">Entry ${event.seq}</p>
      <h2>${escapeHtml(event.title)}</h2>
      <div class="dialog-meta"><span>${escapeHtml(event.short_date)}</span><span>${escapeHtml(event.category)}</span><span>${escapeHtml(event.source)}</span><span>PDF page ${event.page}</span></div>
      <div class="quote-full">${escapeHtml(event.quote)}</div>
      <div class="dialog-actions">
        <button class="dialog-copy" type="button" data-copy="quote">Copy quote</button>
        ${event.url ? `<a class="dialog-copy" href="${escapeAttr(event.url)}" target="_blank" rel="noopener">Open linked source</a>` : ""}
      </div>
    </article>`;
    dialog.showModal();
  }

  function escapeHtml(str="") {
    return String(str).replace(/[&<>"]/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[m]));
  }
  function escapeAttr(str="") { return escapeHtml(str).replace(/'/g, "&#39;"); }

  document.addEventListener("click", (event) => {
    const card = event.target.closest(".card[data-id]");
    if (card) openEvent(card.dataset.id);
    const copy = event.target.closest("[data-copy='quote']");
    if (copy) {
      const text = dialog.querySelector(".quote-full")?.textContent || "";
      navigator.clipboard?.writeText(text);
      copy.textContent = "Copied";
      setTimeout(() => copy.textContent = "Copy quote", 1100);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      const card = event.target.closest(".card[data-id]");
      if (card) openEvent(card.dataset.id);
    }
  });
  $("#search").addEventListener("input", (event) => { state.query = event.target.value; render(); });
  $("#yearRange").addEventListener("input", (event) => { state.maxYear = Number(event.target.value); $("#yearLabel").textContent = state.maxYear; render(); });
  $("#resetView").addEventListener("click", () => {
    state.query = ""; state.categories.clear(); state.maxYear = 2014;
    $("#search").value = ""; $("#yearRange").value = "2014"; $("#yearLabel").textContent = "2014";
    document.querySelectorAll(".chip").forEach(chip => chip.setAttribute("aria-pressed", "false"));
    render();
  });
  $("#exportJson").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "satoshi-timeline-data.json"; a.click();
    URL.revokeObjectURL(url);
  });

  renderStats(); renderFilters(); $("#yearLabel").textContent = state.maxYear; render();
})();
