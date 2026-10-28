(function () {
  "use strict";

  var STORAGE_KEY = "camsCoolSharingGame_v1";
  var ZOOM_STEPS = [70, 80, 90, 100, 115, 130];
  var MAX_TOYS = 10;
  var MIN_TOYS = 1;

  var TOY_SHAPES = [
    { id: "ball", label: "Ball", color: "#ef476f" },
    { id: "car", label: "Car", color: "#118ab2" },
    { id: "bear", label: "Bear", color: "#c9a227" },
    { id: "blocks", label: "Blocks", color: "#06d6a0" },
    { id: "kite", label: "Kite", color: "#9b5de5" },
    { id: "book", label: "Book", color: "#f77f00" },
    { id: "robot", label: "Robot", color: "#4cc9f0" },
    { id: "drum", label: "Drum", color: "#e63946" },
    { id: "dino", label: "Dino", color: "#2a9d8f" },
    { id: "star", label: "Star", color: "#ffd166" }
  ];

  var CHILDREN = [
    { id: "c1", name: "Ava", skin: "skin-peach", shirt: "shirt-red" },
    { id: "c2", name: "Ben", skin: "skin-tan", shirt: "shirt-blue" },
    { id: "c3", name: "Cora", skin: "skin-rose", shirt: "shirt-green" },
    { id: "c4", name: "Diego", skin: "skin-brown", shirt: "shirt-purple" },
    { id: "c5", name: "Elena", skin: "skin-gold", shirt: "shirt-orange" },
    { id: "c6", name: "Finn", skin: "skin-amber", shirt: "shirt-teal" }
  ];

  var state = {
    toys: [],
    assignments: {},
    selectedToyId: null,
    timerStarted: false,
    timerDone: false,
    startMs: 0,
    elapsedMs: 0,
    timerId: null,
    zoom: 100,
    audioReady: false,
    audioCtx: null
  };

  var els = {};

  function defaultToys() {
    return TOY_SHAPES.slice(0, 6).map(function (shape, index) {
      return {
        id: "toy-" + shape.id + "-" + index,
        shape: shape.id,
        name: shape.label,
        color: shape.color
      };
    });
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.toys) || data.toys.length < MIN_TOYS) {
        return null;
      }
      return data;
    } catch (err) {
      return null;
    }
  }

  function saveLook() {
    var payload = {
      look: {
        toys: state.toys.map(function (t) {
          return {
            id: t.id,
            shape: t.shape,
            name: t.name,
            color: t.color
          };
        }),
        children: CHILDREN.map(function (c) {
          return { id: c.id, name: c.name };
        })
      },
      toys: state.toys,
      zoom: state.zoom,
      updatedAt: Date.now()
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      /* ignore quota errors */
    }
  }

  function shapeMeta(shapeId) {
    for (var i = 0; i < TOY_SHAPES.length; i++) {
      if (TOY_SHAPES[i].id === shapeId) {
        return TOY_SHAPES[i];
      }
    }
    return TOY_SHAPES[0];
  }

  function toySvg(toy, size) {
    var s = size || 56;
    var c = toy.color || "#ef476f";
    var shape = toy.shape;
    var inner = "";

    if (shape === "ball") {
      inner =
        '<circle cx="28" cy="28" r="20" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M8 28h40M28 8c8 8 8 32 0 40M28 8c-8 8-8 32 0 40" fill="none" stroke="#16324f" stroke-width="2"/>';
    } else if (shape === "car") {
      inner =
        '<rect x="8" y="24" width="40" height="16" rx="5" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M16 24l6-10h14l6 10" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="18" cy="42" r="5" fill="#16324f"/><circle cx="38" cy="42" r="5" fill="#16324f"/>';
    } else if (shape === "bear") {
      inner =
        '<circle cx="14" cy="14" r="8" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="42" cy="14" r="8" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="28" cy="30" r="18" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="22" cy="28" r="2.5" fill="#16324f"/><circle cx="34" cy="28" r="2.5" fill="#16324f"/>' +
        '<ellipse cx="28" cy="35" rx="4" ry="3" fill="#ffb4a2" stroke="#16324f" stroke-width="1.5"/>';
    } else if (shape === "blocks") {
      inner =
        '<rect x="8" y="28" width="18" height="18" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<rect x="26" y="20" width="18" height="18" fill="#ffd166" stroke="#16324f" stroke-width="3"/>' +
        '<rect x="18" y="10" width="18" height="18" fill="#118ab2" stroke="#16324f" stroke-width="3"/>';
    } else if (shape === "kite") {
      inner =
        '<path d="M28 6l16 22-16 22L12 28z" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M28 28v22" stroke="#16324f" stroke-width="2"/>' +
        '<path d="M28 40c6 4 8 8 6 12M28 46c-6 3-8 7-5 10" fill="none" stroke="#16324f" stroke-width="2"/>';
    } else if (shape === "book") {
      inner =
        '<rect x="12" y="10" width="32" height="36" rx="3" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M28 10v36" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M16 18h8M16 26h8M32 18h8M32 26h8" stroke="#fff8e7" stroke-width="2"/>';
    } else if (shape === "robot") {
      inner =
        '<rect x="16" y="14" width="24" height="20" rx="4" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<rect x="18" y="36" width="20" height="12" rx="3" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="22" cy="24" r="3" fill="#16324f"/><circle cx="34" cy="24" r="3" fill="#16324f"/>' +
        '<line x1="28" y1="8" x2="28" y2="14" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="28" cy="7" r="3" fill="#ef476f" stroke="#16324f" stroke-width="2"/>';
    } else if (shape === "drum") {
      inner =
        '<ellipse cx="28" cy="18" rx="18" ry="8" fill="#fff8e7" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M10 18v16c0 6 8 10 18 10s18-4 18-10V18" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<line x1="14" y1="8" x2="22" y2="18" stroke="#16324f" stroke-width="3"/>' +
        '<line x1="42" y1="8" x2="34" y2="18" stroke="#16324f" stroke-width="3"/>';
    } else if (shape === "dino") {
      inner =
        '<ellipse cx="28" cy="32" rx="18" ry="12" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="40" cy="18" r="10" fill="' + c + '" stroke="#16324f" stroke-width="3"/>' +
        '<path d="M12 32c-6 2-8 8-4 12" fill="none" stroke="#16324f" stroke-width="3"/>' +
        '<circle cx="43" cy="16" r="2" fill="#16324f"/>' +
        '<path d="M22 20l4-8 4 6 4-7 3 7" fill="none" stroke="#16324f" stroke-width="2"/>';
    } else {
      inner =
        '<polygon points="28,6 33,20 48,20 36,30 41,44 28,35 15,44 20,30 8,20 23,20" fill="' +
        c +
        '" stroke="#16324f" stroke-width="3"/>';
    }

    return (
      '<svg class="toy-icon" viewBox="0 0 56 56" width="' +
      s +
      '" height="' +
      s +
      '" aria-hidden="true">' +
      inner +
      "</svg>"
    );
  }

  function childHtml(child) {
    return (
      '<div class="child-figure" aria-hidden="true">' +
      '<div class="child-face ' +
      child.skin +
      '">' +
      '<div class="child-eyes"><span class="child-eye"></span><span class="child-eye"></span></div>' +
      '<div class="child-smile"></div>' +
      "</div>" +
      '<div class="child-body ' +
      child.shirt +
      '"><div class="child-arms ' +
      child.shirt +
      '"></div></div>' +
      "</div>" +
      '<div class="child-name">' +
      escapeHtml(child.name) +
      "</div>" +
      '<div class="held-toy" data-held></div>'
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function givenToyIds() {
    var ids = {};
    Object.keys(state.assignments).forEach(function (childId) {
      ids[state.assignments[childId]] = true;
    });
    return ids;
  }

  function freeToys() {
    var given = givenToyIds();
    return state.toys.filter(function (t) {
      return !given[t.id];
    });
  }

  function findToy(id) {
    for (var i = 0; i < state.toys.length; i++) {
      if (state.toys[i].id === id) {
        return state.toys[i];
      }
    }
    return null;
  }

  function childrenNeedingToys() {
    return CHILDREN.filter(function (c) {
      return !state.assignments[c.id];
    });
  }

  function allChildrenHaveToys() {
    return CHILDREN.every(function (c) {
      return !!state.assignments[c.id];
    });
  }

  function kindnessPercent() {
    var have = 0;
    CHILDREN.forEach(function (c) {
      if (state.assignments[c.id]) {
        have += 1;
      }
    });
    return Math.round((have / CHILDREN.length) * 100);
  }

  function renderZoom() {
    els.zoomRow.innerHTML = "";
    ZOOM_STEPS.forEach(function (step) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "zoom-btn" + (state.zoom === step ? " active" : "");
      btn.textContent = step + "%";
      btn.setAttribute("aria-label", "Zoom " + step + " percent");
      btn.addEventListener("click", function () {
        unlockAudio();
        setZoom(step);
      });
      els.zoomRow.appendChild(btn);
    });
  }

  function setZoom(step) {
    state.zoom = step;
    document.documentElement.style.setProperty("--z", String(step / 100));
    renderZoom();
    saveLook();
  }

  function renderChildren() {
    els.childrenRow.innerHTML = "";
    CHILDREN.forEach(function (child) {
      var card = document.createElement("div");
      card.className = "child";
      card.setAttribute("data-child-id", child.id);
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute(
        "aria-label",
        child.name + (state.assignments[child.id] ? " already has a toy" : " needs a toy")
      );
      if (state.assignments[child.id]) {
        card.className += " has-toy";
      }
      card.innerHTML = childHtml(child);
      var held = card.querySelector("[data-held]");
      var toyId = state.assignments[child.id];
      if (toyId) {
        var toy = findToy(toyId);
        if (toy) {
          held.innerHTML = toySvg(toy, 38);
        }
      }
      card.addEventListener("click", function () {
        unlockAudio();
        onChildActivate(child.id);
      });
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          unlockAudio();
          onChildActivate(child.id);
        }
      });
      els.childrenRow.appendChild(card);
    });
  }

  function renderToys() {
    els.toysRow.innerHTML = "";
    var given = givenToyIds();
    state.toys.forEach(function (toy) {
      var card = document.createElement("div");
      card.className = "toy";
      card.setAttribute("data-toy-id", toy.id);
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", given[toy.id] ? "-1" : "0");
      card.setAttribute("aria-label", toy.name);
      card.setAttribute("draggable", given[toy.id] ? "false" : "true");
      if (given[toy.id]) {
        card.className += " given";
      }
      if (state.selectedToyId === toy.id) {
        card.className += " selected";
      }
      card.innerHTML = toySvg(toy, 56) + '<div class="toy-label">' + escapeHtml(toy.name) + "</div>";
      if (!given[toy.id]) {
        card.addEventListener("click", function (e) {
          e.stopPropagation();
          unlockAudio();
          selectToy(toy.id);
        });
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            unlockAudio();
            selectToy(toy.id);
          }
        });
        bindDrag(card, toy.id);
      }
      els.toysRow.appendChild(card);
    });
  }

  function renderToyboxList() {
    els.toyboxList.innerHTML = "";
    state.toys.forEach(function (toy) {
      var chip = document.createElement("div");
      chip.className = "toybox-chip";
      chip.innerHTML = toySvg(toy, 28) + "<span>" + escapeHtml(toy.name) + "</span>";
      els.toyboxList.appendChild(chip);
    });
  }

  function renderKindness() {
    var pct = kindnessPercent();
    els.kindnessFill.style.width = pct + "%";
    els.kindnessTrack.setAttribute("aria-valuenow", String(pct));
  }

  function renderAll() {
    renderChildren();
    renderToys();
    renderToyboxList();
    renderKindness();
    updatePrompt();
  }

  function updatePrompt() {
    if (state.timerDone || allChildrenHaveToys()) {
      els.prompt.textContent = "Everyone has a toy!";
      return;
    }
    if (state.selectedToyId) {
      var toy = findToy(state.selectedToyId);
      els.prompt.textContent = toy ? "Give " + toy.name + " to a friend!" : "Share the toys!";
      return;
    }
    els.prompt.textContent = "Share the toys!";
  }

  function selectToy(toyId) {
    if (givenToyIds()[toyId]) {
      return;
    }
    state.selectedToyId = state.selectedToyId === toyId ? null : toyId;
    renderToys();
    updatePrompt();
  }

  function onChildActivate(childId) {
    if (state.assignments[childId]) {
      return;
    }
    if (!state.selectedToyId) {
      els.hint.textContent = "Tap a toy first, then tap a friend.";
      return;
    }
    giveToy(state.selectedToyId, childId);
  }

  function giveToy(toyId, childId) {
    if (state.assignments[childId]) {
      return;
    }
    if (givenToyIds()[toyId]) {
      return;
    }
    if (!findToy(toyId)) {
      return;
    }

    state.assignments[childId] = toyId;
    state.selectedToyId = null;
    els.hint.textContent = "Drag a toy to a friend, or tap a toy then tap a friend.";

    ensureTimerStarted();
    renderAll();
    burstConfetti();
    playCheer();

    if (allChildrenHaveToys()) {
      finishGame();
    }
  }

  function ensureTimerStarted() {
    if (state.timerStarted) {
      return;
    }
    state.timerStarted = true;
    state.startMs = Date.now();
    state.timerId = setInterval(tickTimer, 100);
    tickTimer();
  }

  function tickTimer() {
    if (state.timerDone) {
      return;
    }
    state.elapsedMs = Date.now() - state.startMs;
    els.timer.textContent = formatTime(state.elapsedMs);
  }

  function formatTime(ms) {
    return (ms / 1000).toFixed(1) + "s";
  }

  function finishGame() {
    state.timerDone = true;
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.elapsedMs = Date.now() - state.startMs;
    els.timer.textContent = formatTime(state.elapsedMs);
    els.winMessage.textContent = "Everyone has a toy. Great job sharing!";
    els.winTime.textContent = "You shared in " + formatTime(state.elapsedMs) + "!";
    els.winOverlay.classList.remove("hidden");
    updatePrompt();
    burstConfetti(40);
    playCheer(true);
  }

  function resetPlay(keepToys) {
    if (state.timerId) {
      clearInterval(state.timerId);
      state.timerId = null;
    }
    state.assignments = {};
    state.selectedToyId = null;
    state.timerStarted = false;
    state.timerDone = false;
    state.startMs = 0;
    state.elapsedMs = 0;
    els.timer.textContent = "0.0s";
    els.winOverlay.classList.add("hidden");
    if (!keepToys) {
      /* toys stay; only assignments clear for play again */
    }
    renderAll();
  }

  function resetToysToDefault() {
    state.toys = defaultToys();
    resetPlay(true);
    saveLook();
  }

  /* ---------- Audio (after click only) ---------- */

  function unlockAudio() {
    if (state.audioReady) {
      return;
    }
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
      return;
    }
    try {
      state.audioCtx = new Ctx();
      if (state.audioCtx.state === "suspended") {
        state.audioCtx.resume();
      }
      state.audioReady = true;
    } catch (err) {
      state.audioReady = false;
    }
  }

  function playCheer(big) {
    if (!state.audioCtx) {
      return;
    }
    try {
      if (state.audioCtx.state === "suspended") {
        state.audioCtx.resume();
      }
      var ctx = state.audioCtx;
      var now = ctx.currentTime;
      var notes = big
        ? [523.25, 659.25, 783.99, 1046.5]
        : [392.0, 523.25, 659.25];
      notes.forEach(function (freq, i) {
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02 + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35 + i * 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + 0.45 + i * 0.08);
      });
    } catch (err) {
      /* keep confetti + kindness if audio fails */
    }
  }

  /* ---------- Confetti ---------- */

  function burstConfetti(count) {
    var n = count || 24;
    var colors = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#9b5de5", "#f77f00"];
    for (var i = 0; i < n; i++) {
      (function (idx) {
        var piece = document.createElement("div");
        piece.className = "confetti-piece";
        piece.style.left = Math.random() * 100 + "%";
        piece.style.background = colors[idx % colors.length];
        piece.style.animationDuration = 0.9 + Math.random() * 1.1 + "s";
        piece.style.transform = "rotate(" + Math.floor(Math.random() * 360) + "deg)";
        els.confettiLayer.appendChild(piece);
        setTimeout(function () {
          if (piece.parentNode) {
            piece.parentNode.removeChild(piece);
          }
        }, 2200);
      })(i);
    }
  }

  /* ---------- Drag + drop (mouse/touch) with tap fallback ---------- */

  function bindDrag(card, toyId) {
    var ghost = null;
    var dragging = false;
    var startX = 0;
    var startY = 0;
    var moved = false;

    function pointFromEvent(e) {
      if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
      if (e.changedTouches && e.changedTouches.length) {
        return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      }
      return { x: e.clientX, y: e.clientY };
    }

    function childUnder(x, y) {
      var nodes = els.childrenRow.querySelectorAll(".child");
      for (var i = 0; i < nodes.length; i++) {
        var r = nodes[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
          return nodes[i];
        }
      }
      return null;
    }

    function clearTargets() {
      var nodes = els.childrenRow.querySelectorAll(".child");
      for (var i = 0; i < nodes.length; i++) {
        nodes[i].classList.remove("drop-target");
      }
    }

    function onMove(e) {
      if (!dragging) {
        return;
      }
      var p = pointFromEvent(e);
      if (Math.abs(p.x - startX) > 6 || Math.abs(p.y - startY) > 6) {
        moved = true;
      }
      if (ghost) {
        ghost.style.left = p.x + "px";
        ghost.style.top = p.y + "px";
      }
      clearTargets();
      var over = childUnder(p.x, p.y);
      if (over && !over.classList.contains("has-toy")) {
        over.classList.add("drop-target");
      }
      if (e.cancelable) {
        e.preventDefault();
      }
    }

    function onEnd(e) {
      if (!dragging) {
        return;
      }
      dragging = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onEnd);

      var p = pointFromEvent(e);
      clearTargets();
      if (ghost && ghost.parentNode) {
        ghost.parentNode.removeChild(ghost);
      }
      ghost = null;
      card.classList.remove("dragging");

      if (moved) {
        var over = childUnder(p.x, p.y);
        if (over && !over.classList.contains("has-toy")) {
          unlockAudio();
          giveToy(toyId, over.getAttribute("data-child-id"));
        }
      }
    }

    function onStart(e) {
      if (givenToyIds()[toyId]) {
        return;
      }
      unlockAudio();
      var p = pointFromEvent(e);
      dragging = true;
      moved = false;
      startX = p.x;
      startY = p.y;
      state.selectedToyId = toyId;
      renderToys();
      updatePrompt();
      card.classList.add("dragging");

      var toy = findToy(toyId);
      ghost = document.createElement("div");
      ghost.className = "ghost-toy";
      ghost.innerHTML = toySvg(toy, 64);
      ghost.style.left = p.x + "px";
      ghost.style.top = p.y + "px";
      document.body.appendChild(ghost);

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
      document.addEventListener("touchcancel", onEnd);

      if (e.type === "mousedown") {
        e.preventDefault();
      }
    }

    card.addEventListener("mousedown", onStart);
    card.addEventListener("touchstart", onStart, { passive: true });

    card.addEventListener("dragstart", function (e) {
      /* native HTML5 drag is flaky on trackpads; we use pointer drag instead */
      e.preventDefault();
    });
  }

  /* ---------- Toy box actions (add / change / take away) ---------- */

  var modalMode = null;
  var modalChoiceId = null;

  function openModal(opts) {
    modalMode = opts.mode;
    modalChoiceId = null;
    els.modalTitle.textContent = opts.title;
    els.modalBody.textContent = opts.body || "";
    els.modalChoices.innerHTML = "";
    els.modalInput.value = opts.inputValue || "";
    els.modalLabel.classList.toggle("hidden", !opts.showInput);
    els.modalInput.classList.toggle("hidden", !opts.showInput);
    els.modalOk.classList.toggle("hidden", !!opts.hideOk);
    els.modalOk.textContent = opts.okText || "OK";

    if (opts.choices) {
      opts.choices.forEach(function (toy) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "choice-btn";
        btn.innerHTML = toySvg(toy, 32) + "<span>" + escapeHtml(toy.name) + "</span>";
        btn.addEventListener("click", function () {
          modalChoiceId = toy.id;
          var all = els.modalChoices.querySelectorAll(".choice-btn");
          for (var i = 0; i < all.length; i++) {
            all[i].classList.remove("picked");
          }
          btn.classList.add("picked");
          if (opts.onPick) {
            opts.onPick(toy);
          }
        });
        els.modalChoices.appendChild(btn);
      });
    }

    els.modal.classList.remove("hidden");
    if (opts.showInput) {
      setTimeout(function () {
        els.modalInput.focus();
        els.modalInput.select();
      }, 30);
    }
  }

  function closeModal() {
    els.modal.classList.add("hidden");
    modalMode = null;
    modalChoiceId = null;
  }

  function actionAdd() {
    unlockAudio();
    if (state.toys.length >= MAX_TOYS) {
      openModal({
        mode: "info",
        title: "Toy box is full",
        body: "You can keep up to " + MAX_TOYS + " toys. Take one away to add another.",
        hideOk: false,
        okText: "OK"
      });
      return;
    }

    var usedShapes = {};
    state.toys.forEach(function (t) {
      usedShapes[t.shape] = true;
    });
    var next = null;
    for (var i = 0; i < TOY_SHAPES.length; i++) {
      if (!usedShapes[TOY_SHAPES[i].id]) {
        next = TOY_SHAPES[i];
        break;
      }
    }
    if (!next) {
      next = TOY_SHAPES[state.toys.length % TOY_SHAPES.length];
    }

    openModal({
      mode: "add",
      title: "Add a toy",
      body: "Name your new toy:",
      showInput: true,
      inputValue: next.label,
      okText: "Add toy",
      _shape: next
    });
    els.modal.dataset.shape = next.id;
    els.modal.dataset.color = next.color;
  }

  function actionRename() {
    unlockAudio();
    if (!state.toys.length) {
      return;
    }
    openModal({
      mode: "rename-pick",
      title: "Change a toy's name",
      body: "Pick a toy, then type a new name.",
      choices: state.toys.slice(),
      showInput: true,
      inputValue: state.toys[0].name,
      okText: "Save name",
      onPick: function (toy) {
        els.modalInput.value = toy.name;
        els.modalInput.focus();
        els.modalInput.select();
      }
    });
    modalChoiceId = state.toys[0].id;
    var first = els.modalChoices.querySelector(".choice-btn");
    if (first) {
      first.classList.add("picked");
    }
  }

  function actionRemove() {
    unlockAudio();
    if (state.toys.length <= MIN_TOYS) {
      openModal({
        mode: "info",
        title: "Keep at least one toy",
        body: "There must be at least one toy to share.",
        okText: "OK"
      });
      return;
    }
    openModal({
      mode: "remove",
      title: "Take a toy away",
      body: "Pick the toy to remove.",
      choices: state.toys.slice(),
      okText: "Take away"
    });
  }

  function confirmModal() {
    if (modalMode === "info") {
      closeModal();
      return;
    }

    if (modalMode === "add") {
      var name = (els.modalInput.value || "").trim() || "Toy";
      if (name.length > 18) {
        name = name.slice(0, 18);
      }
      var shapeId = els.modal.dataset.shape || "star";
      var color = els.modal.dataset.color || "#ffd166";
      var meta = shapeMeta(shapeId);
      state.toys.push({
        id: "toy-" + shapeId + "-" + Date.now(),
        shape: shapeId,
        name: name,
        color: color || meta.color
      });
      /* If mid-game and more toys than children, extra toys stay in the share row. */
      closeModal();
      renderAll();
      saveLook();
      return;
    }

    if (modalMode === "rename-pick") {
      if (!modalChoiceId) {
        return;
      }
      var newName = (els.modalInput.value || "").trim();
      if (!newName) {
        return;
      }
      if (newName.length > 18) {
        newName = newName.slice(0, 18);
      }
      var toy = findToy(modalChoiceId);
      if (toy) {
        toy.name = newName;
      }
      closeModal();
      renderAll();
      saveLook();
      return;
    }

    if (modalMode === "remove") {
      if (!modalChoiceId) {
        return;
      }
      if (state.toys.length <= MIN_TOYS) {
        closeModal();
        return;
      }
      var removeId = modalChoiceId;
      state.toys = state.toys.filter(function (t) {
        return t.id !== removeId;
      });
      Object.keys(state.assignments).forEach(function (childId) {
        if (state.assignments[childId] === removeId) {
          delete state.assignments[childId];
        }
      });
      if (state.selectedToyId === removeId) {
        state.selectedToyId = null;
      }
      /* Removing a given toy un-finishes the win state if needed */
      if (state.timerDone && !allChildrenHaveToys()) {
        state.timerDone = false;
        els.winOverlay.classList.add("hidden");
        if (state.timerStarted && !state.timerId) {
          state.startMs = Date.now() - state.elapsedMs;
          state.timerId = setInterval(tickTimer, 100);
        }
      }
      closeModal();
      renderAll();
      saveLook();
    }
  }

  /* ---------- Boot ---------- */

  function cacheEls() {
    els.app = document.getElementById("app");
    els.timer = document.getElementById("timer");
    els.kindnessFill = document.getElementById("kindnessFill");
    els.kindnessTrack = document.getElementById("kindnessTrack");
    els.zoomRow = document.getElementById("zoomRow");
    els.prompt = document.getElementById("prompt");
    els.childrenRow = document.getElementById("childrenRow");
    els.toysRow = document.getElementById("toysRow");
    els.hint = document.getElementById("hint");
    els.toyboxList = document.getElementById("toyboxList");
    els.confettiLayer = document.getElementById("confettiLayer");
    els.winOverlay = document.getElementById("winOverlay");
    els.winMessage = document.getElementById("winMessage");
    els.winTime = document.getElementById("winTime");
    els.btnPlayAgain = document.getElementById("btnPlayAgain");
    els.btnAdd = document.getElementById("btnAdd");
    els.btnRename = document.getElementById("btnRename");
    els.btnRemove = document.getElementById("btnRemove");
    els.btnReset = document.getElementById("btnReset");
    els.modal = document.getElementById("modal");
    els.modalTitle = document.getElementById("modalTitle");
    els.modalBody = document.getElementById("modalBody");
    els.modalChoices = document.getElementById("modalChoices");
    els.modalLabel = document.getElementById("modalLabel");
    els.modalInput = document.getElementById("modalInput");
    els.modalCancel = document.getElementById("modalCancel");
    els.modalOk = document.getElementById("modalOk");
  }

  function bindUi() {
    els.btnAdd.addEventListener("click", actionAdd);
    els.btnRename.addEventListener("click", actionRename);
    els.btnRemove.addEventListener("click", actionRemove);
    els.btnReset.addEventListener("click", function () {
      unlockAudio();
      resetToysToDefault();
    });
    els.btnPlayAgain.addEventListener("click", function () {
      unlockAudio();
      resetPlay(true);
      saveLook();
    });
    els.modalCancel.addEventListener("click", closeModal);
    els.modalOk.addEventListener("click", confirmModal);
    els.modalInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        confirmModal();
      }
    });
    document.addEventListener(
      "click",
      function () {
        unlockAudio();
      },
      true
    );
  }

  function init() {
    cacheEls();
    var saved = loadSaved();
    if (saved && Array.isArray(saved.toys) && saved.toys.length) {
      state.toys = saved.toys.map(function (t) {
        var meta = shapeMeta(t.shape);
        return {
          id: t.id || "toy-" + meta.id + "-" + Math.random().toString(36).slice(2, 8),
          shape: t.shape || meta.id,
          name: t.name || meta.label,
          color: t.color || meta.color
        };
      });
      if (saved.zoom && ZOOM_STEPS.indexOf(saved.zoom) !== -1) {
        state.zoom = saved.zoom;
      }
    } else {
      state.toys = defaultToys();
    }

    /* Ensure at least 6 toys for a fresh classroom feel when empty save */
    if (state.toys.length < 6 && !saved) {
      state.toys = defaultToys();
    }

    setZoom(state.zoom);
    bindUi();
    renderAll();
    saveLook();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
