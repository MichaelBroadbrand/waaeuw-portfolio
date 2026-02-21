document.addEventListener('DOMContentLoaded', function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /* ================================================
     SOUND EFFECTS (Web Audio API) — init early for boot
     ================================================ */
  var soundEnabled = localStorage.getItem('sfx') !== 'off';
  var soundToggle = document.getElementById('sound-toggle');
  var audioCtx = null;

  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type, volume) {
    if (!soundEnabled) return;
    try {
      var ac = getAudioCtx();
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.value = volume || 0.04;
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start();
      osc.stop(ac.currentTime + duration);
    } catch (e) {}
  }

  function playBootSound() {
    if (!soundEnabled) return;
    try {
      var ac = getAudioCtx();
      var now = ac.currentTime;
      // POST beep - classic single BIOS tone
      var osc1 = ac.createOscillator();
      var g1 = ac.createGain();
      osc1.type = 'square';
      osc1.frequency.value = 1000;
      g1.gain.setValueAtTime(0.05, now);
      g1.gain.setValueAtTime(0.05, now + 0.15);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc1.connect(g1);
      g1.connect(ac.destination);
      osc1.start(now);
      osc1.stop(now + 0.2);
      // Second lower tone — disk spin-up feel
      var osc2 = ac.createOscillator();
      var g2 = ac.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(120, now + 0.25);
      osc2.frequency.linearRampToValueAtTime(200, now + 0.6);
      osc2.frequency.linearRampToValueAtTime(180, now + 0.9);
      g2.gain.setValueAtTime(0, now + 0.25);
      g2.gain.linearRampToValueAtTime(0.02, now + 0.35);
      g2.gain.setValueAtTime(0.02, now + 0.7);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc2.connect(g2);
      g2.connect(ac.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 0.9);
      // Third tone — success chime
      var osc3 = ac.createOscillator();
      var g3 = ac.createGain();
      osc3.type = 'sine';
      osc3.frequency.value = 800;
      g3.gain.setValueAtTime(0, now + 0.95);
      g3.gain.linearRampToValueAtTime(0.03, now + 1.0);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc3.connect(g3);
      g3.connect(ac.destination);
      osc3.start(now + 0.95);
      osc3.stop(now + 1.3);
    } catch (e) {}
  }
  function playBootBeep() { playTone(800, 0.06, 'square', 0.03); }
  function playKeyClick() { playTone(1200, 0.03, 'square', 0.02); }
  function playHoverTone() { playTone(600, 0.08, 'sine', 0.02); }
  function playEnterTone() { playTone(400, 0.12, 'sawtooth', 0.03); }

  if (soundToggle) {
    soundToggle.textContent = soundEnabled ? '[SFX: ON]' : '[SFX: OFF]';
    soundToggle.addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      localStorage.setItem('sfx', soundEnabled ? 'on' : 'off');
      soundToggle.textContent = soundEnabled ? '[SFX: ON]' : '[SFX: OFF]';
      if (soundEnabled) playTone(500, 0.1, 'sine', 0.03);
    });
  }

  /* ================================================
     THEME TOGGLE (load early to prevent flash)
     ================================================ */
  var themeToggle = document.getElementById('theme-toggle');
  var savedTheme = localStorage.getItem('theme');

  function applyTheme(dark) {
    if (dark) {
      document.body.classList.add('dark');
      if (themeToggle) themeToggle.textContent = '[LIGHT]';
    } else {
      document.body.classList.remove('dark');
      if (themeToggle) themeToggle.textContent = '[DARK]';
    }
  }

  applyTheme(savedTheme === 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var isDark = document.body.classList.toggle('dark');
      themeToggle.textContent = isDark ? '[LIGHT]' : '[DARK]';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  /* ================================================
     TYPED TAGLINE (setup)
     ================================================ */
  var taglineEl = document.querySelector('.hero__tagline');
  var taglineText = '';
  var taglineCursor = null;

  if (taglineEl) {
    taglineText = taglineEl.textContent.replace(/\u2588/g, '').trim();
    taglineCursor = taglineEl.querySelector('.cursor');
    taglineEl.textContent = '';
    if (taglineCursor) taglineEl.appendChild(taglineCursor);
  }

  /* ================================================
     ASCII ART SCRAMBLE ANIMATION
     ================================================ */
  var asciiEl = document.querySelector('.hero__ascii');
  var asciiOriginal = '';
  var asciiChars = '/@#$%&*!=+<>[]{}|\\^~`;:.,01';

  function scrambleAscii() {
    if (!asciiEl || prefersReduced) return;
    if (!asciiOriginal) asciiOriginal = asciiEl.textContent;
    var lines = asciiOriginal.split('\n');
    var totalFrames = 30;
    var frame = 0;

    var asciiInterval = setInterval(function () {
      var result = lines.map(function (line) {
        return line.split('').map(function (ch, i) {
          if (ch === ' ' || ch === '\n') return ch;
          var revealPoint = (i / line.length) * totalFrames;
          if (frame >= revealPoint) return ch;
          return asciiChars[Math.floor(Math.random() * asciiChars.length)];
        }).join('');
      }).join('\n');

      asciiEl.textContent = result;
      frame++;

      if (frame > totalFrames) {
        clearInterval(asciiInterval);
        asciiEl.textContent = asciiOriginal;
        setTimeout(scrambleAscii, 5000);
      }
    }, 50);
  }

  function typeTagline() {
    if (!taglineEl || !taglineText) return;
    var i = 0;
    function typeChar() {
      if (i < taglineText.length) {
        taglineEl.insertBefore(
          document.createTextNode(taglineText[i]),
          taglineCursor
        );
        i++;
        setTimeout(typeChar, 50);
      }
    }
    typeChar();
  }

  /* ================================================
     BOOT SEQUENCE
     ================================================ */
  var bootEl = document.getElementById('boot');
  var bootLog = document.getElementById('boot-log');

  if (bootEl && bootLog && !prefersReduced) {
    document.body.classList.add('boot-active');

    var bootLines = [
      '> LOADING WAAEUW.SYS...',
      '> CHECKING MODULES.......... OK',
      '> LUAU RUNTIME.............. OK',
      '> DATASTORESERVICE.......... OK',
      '> NETWORKING................ OK',
      '> ANTI-EXPLOIT.............. OK',
      '> READY.'
    ];

    var lineIndex = 0;
    function typeLine() {
      if (lineIndex >= bootLines.length) {
        setTimeout(function () {
          bootEl.classList.add('boot--done');
          document.body.classList.remove('boot-active');
          bootEl.addEventListener('transitionend', function () {
            bootEl.remove();
            scrambleAscii();
            typeTagline();
          });
        }, 400);
        return;
      }
      var p = document.createElement('p');
      p.textContent = bootLines[lineIndex];
      bootLog.appendChild(p);
      lineIndex++;
      setTimeout(typeLine, 100);
    }
    typeLine();
  } else if (bootEl) {
    bootEl.remove();
    if (prefersReduced) {
      // Show full text immediately
      if (taglineEl && taglineText) {
        taglineEl.insertBefore(document.createTextNode(taglineText), taglineCursor);
      }
    } else {
      scrambleAscii();
      typeTagline();
    }
  }

  /* ================================================
     SCROLL REVEAL
     ================================================ */
  var sections = document.querySelectorAll('.section');

  if (!prefersReduced && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(function (s) { observer.observe(s); });
  } else {
    sections.forEach(function (s) { s.classList.add('visible'); });
  }

  /* ================================================
     STAGGERED SKILL CELL REVEAL
     ================================================ */
  var skillGrids = document.querySelectorAll('.skills__grid');

  if (!prefersReduced && 'IntersectionObserver' in window) {
    var cellObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var cells = entry.target.querySelectorAll('.skills__cell');
          cells.forEach(function (cell, i) {
            setTimeout(function () {
              cell.classList.add('cell-visible');
            }, i * 60);
          });
          cellObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    skillGrids.forEach(function (g) { cellObserver.observe(g); });
  } else {
    document.querySelectorAll('.skills__cell').forEach(function (c) {
      c.classList.add('cell-visible');
    });
  }

  /* ================================================
     SKILL CELL SCRAMBLE ON HOVER
     ================================================ */
  if (!prefersReduced) {
    var skillCells = document.querySelectorAll('.skills__cell');
    var scrambleChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*_&';

    skillCells.forEach(function (cell) {
      var originalText = cell.textContent;
      var scrambleInterval = null;

      cell.addEventListener('mouseenter', function () {
        var text = originalText;
        var frame = 0;
        var totalFrames = 8;

        if (scrambleInterval) clearInterval(scrambleInterval);
        scrambleInterval = setInterval(function () {
          cell.textContent = text.split('').map(function (ch, i) {
            if (ch === ' ') return ' ';
            if (i < (frame / totalFrames) * text.length) return text[i];
            return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }).join('');
          frame++;
          if (frame > totalFrames) {
            clearInterval(scrambleInterval);
            scrambleInterval = null;
            cell.textContent = originalText;
          }
        }, 30);
      });

      cell.addEventListener('mouseleave', function () {
        if (scrambleInterval) {
          clearInterval(scrambleInterval);
          scrambleInterval = null;
        }
        cell.textContent = originalText;
      });
    });
  }

  /* ================================================
     SCROLL PROGRESS BAR
     ================================================ */
  var progressBar = document.getElementById('progress');
  var scrollTimer = null;
  window.addEventListener('scroll', function () {
    if (progressBar) {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = pct + '%';
    }
    document.documentElement.classList.add('scrolling');
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(function () {
      document.documentElement.classList.remove('scrolling');
    }, 800);
  }, { passive: true });

  /* ================================================
     TEXT SCRAMBLE ON SECTION HEADERS
     ================================================ */
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*_';

  function scrambleText(el) {
    var original = el.textContent;
    var length = original.length;
    var iterations = 0;

    var interval = setInterval(function () {
      el.textContent = original.split('').map(function (char, i) {
        if (i < iterations) return original[i];
        if (char === ' ') return ' ';
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');

      iterations += 1;
      if (iterations > length) {
        clearInterval(interval);
        el.textContent = original;
      }
    }, 30);
  }

  if (!prefersReduced && 'IntersectionObserver' in window) {
    var headers = document.querySelectorAll('.section__header');
    var headerObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          scrambleText(entry.target);
          headerObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    headers.forEach(function (h) { headerObserver.observe(h); });
  }

  /* ================================================
     FEATURE 3: ANIMATED STAT COUNTERS
     ================================================ */
  var counters = document.querySelectorAll('.counter');

  if (counters.length && 'IntersectionObserver' in window) {
    if (prefersReduced) {
      counters.forEach(function (c) {
        var suffix = c.getAttribute('data-suffix') || '';
        c.textContent = c.getAttribute('data-target') + suffix;
      });
    } else {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      counters.forEach(function (c) { counterObserver.observe(c); });
    }
  }

  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1500;
    var start = performance.now();

    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      var eased = 1 - (1 - progress) * (1 - progress);
      var current = Math.round(eased * target);
      el.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(tick);
  }

  /* ================================================
     FEATURE 4: MOUSE-REACTIVE HERO
     ================================================ */
  var hero = document.querySelector('.hero');
  var heroName = document.querySelector('.hero__name');

  if (hero && heroName && !prefersReduced) {
    if (!isTouch) {
      hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width - 0.5;  // -0.5 to 0.5
        var y = (e.clientY - rect.top) / rect.height - 0.5;
        var rotateY = x * 8;  // max ~4deg each side
        var rotateX = -y * 8;
        heroName.style.transform = 'rotateY(' + rotateY + 'deg) rotateX(' + rotateX + 'deg)';
      });

      hero.addEventListener('mouseleave', function () {
        heroName.style.transform = 'rotateY(0deg) rotateX(0deg)';
      });
    }
  }

  /* ================================================
     FEATURE 2: INTERACTIVE TERMINAL
     ================================================ */
  var termInput = document.getElementById('terminal-input');
  var termOutput = document.getElementById('terminal-output');

  if (termInput && termOutput) {
    var commands = {
      help: 'AVAILABLE COMMANDS:\n  help     — show this list\n  projects — list projects\n  skills   — list skill categories\n  discord  — discord link\n  about    — who is waaeuw\n  theme    — toggle dark/light mode\n  clear    — clear terminal',
      projects: 'PROJECTS:\n  • ENERGY LEGENDS\n  • PULSE\n  • PICK A ANSWER\n  • PERFECT FREEZE\n  • BHOP-TEST',
      skills: 'SKILL CATEGORIES:\n  • GAMEPLAY\n  • DATA & PERSISTENCE\n  • NETWORKING\n  • UI & POLISH',
      discord: 'DISCORD: waaeuw\nhttps://discordapp.com/users/321284718035468288',
      about: 'WAAEUW — Roblox developer. ~2yrs scripting on Roblox, 3+ years programming. Gameplay systems, data persistence, UI, networking. Available for commissions.'
    };

    termInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      var cmd = termInput.value.trim().toLowerCase();
      termInput.value = '';
      if (!cmd) return;

      // Echo the command
      appendOutput('> ' + cmd.toUpperCase());

      if (cmd === 'clear') {
        termOutput.innerHTML = '';
        return;
      }

      if (cmd === 'theme') {
        var isDark = document.body.classList.toggle('dark');
        if (themeToggle) themeToggle.textContent = isDark ? '[LIGHT]' : '[DARK]';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        appendOutput('THEME: ' + (isDark ? 'DARK' : 'LIGHT') + ' MODE ACTIVATED');
        termOutput.scrollTop = termOutput.scrollHeight;
        return;
      }

      var response = commands[cmd];
      if (response) {
        response.split('\n').forEach(function (line) {
          appendOutput(line);
        });
      } else {
        appendOutput("UNKNOWN COMMAND. TYPE 'help' FOR OPTIONS.");
      }

      termOutput.scrollTop = termOutput.scrollHeight;
    });

    // Auto-focus on click anywhere in terminal
    var terminal = document.querySelector('.terminal');
    if (terminal) {
      terminal.addEventListener('click', function () {
        termInput.focus();
      });
    }
  }

  function appendOutput(text) {
    var p = document.createElement('p');
    p.textContent = text;
    termOutput.appendChild(p);
  }

  /* ================================================
     FOOTER YEAR
     ================================================ */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ================================================
     LIVE GMT+2 CLOCK
     ================================================ */
  var clockEl = document.getElementById('clock');
  if (clockEl) {
    function pad(n) { return n < 10 ? '0' + n : n; }
    function updateClock() {
      var d = new Date();
      var gmt2 = new Date(d.getTime() + 2 * 60 * 60 * 1000);
      clockEl.textContent =
        pad(gmt2.getUTCHours()) + ':' +
        pad(gmt2.getUTCMinutes()) + ':' +
        pad(gmt2.getUTCSeconds()) + ' GMT+2';
    }
    updateClock();
    setInterval(updateClock, 1000);
  }

  /* ================================================
     CUSTOM CURSOR
     ================================================ */
  var cursorDot = document.getElementById('cursor-dot');
  var cursorTrail = document.getElementById('cursor-trail');

  if (cursorDot && cursorTrail && !isTouch) {
    document.body.classList.add('custom-cursor');
    var cursorHover = false;

    document.addEventListener('mousemove', function (e) {
      var scale = cursorHover ? ' scale(1.5)' : '';
      cursorDot.style.transform = 'translate(' + (e.clientX - 4) + 'px, ' + (e.clientY - 4) + 'px)' + scale;
      cursorTrail.style.transform = 'translate(' + (e.clientX - 10) + 'px, ' + (e.clientY - 10) + 'px)';
    });

    document.addEventListener('mouseleave', function () {
      cursorDot.style.display = 'none';
      cursorTrail.style.display = 'none';
    });

    document.addEventListener('mouseenter', function () {
      cursorDot.style.display = 'block';
      cursorTrail.style.display = 'block';
    });

    // Hover state for links and buttons
    var hoverTargets = document.querySelectorAll('a, .btn, button');
    hoverTargets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        cursorHover = true;
      });
      el.addEventListener('mouseleave', function () {
        cursorHover = false;
      });
    });
  }

  /* ================================================
     KONAMI CODE EASTER EGG
     ================================================ */
  var konamiEl = document.getElementById('konami');
  var konamiSequence = [
    'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
    'b', 'a'
  ];
  var konamiIndex = 0;
  var konamiTriggered = false;

  if (konamiEl) {
    document.addEventListener('keydown', function (e) {
      if (konamiTriggered) return;
      if (e.key === konamiSequence[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiSequence.length) {
          konamiTriggered = true;
          konamiEl.classList.add('konami--active');
          setTimeout(function () {
            konamiEl.classList.remove('konami--active');
          }, 2000);
        }
      } else {
        konamiIndex = 0;
      }
    });
  }

  /* ================================================
     COMMAND PALETTE
     ================================================ */
  var palette = document.getElementById('palette');
  var paletteInput = document.getElementById('palette-input');
  var paletteOptions = document.getElementById('palette-options');

  if (palette && paletteInput && paletteOptions) {
    var paletteItems = [
      { label: 'GO TO ABOUT', action: function () { scrollToSection('#about'); } },
      { label: 'GO TO SKILLS', action: function () { scrollToSection('#skills'); } },
      { label: 'GO TO PROJECTS', action: function () { scrollToSection('#projects'); } },
      { label: 'GO TO CONTACT', action: function () { scrollToSection('#contact'); } },
      { label: 'OPEN DISCORD', action: function () { window.open('https://discordapp.com/users/321284718035468288', '_blank'); } },
      { label: 'TOGGLE THEME', action: function () {
        var isDark = document.body.classList.toggle('dark');
        if (themeToggle) themeToggle.textContent = isDark ? '[LIGHT]' : '[DARK]';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      }}
    ];
    var activeIndex = 0;
    var filteredItems = paletteItems.slice();

    function scrollToSection(sel) {
      var el = document.querySelector(sel);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }

    function openPalette() {
      palette.classList.add('palette--open');
      paletteInput.value = '';
      activeIndex = 0;
      filterOptions('');
      paletteInput.focus();
    }

    function closePalette() {
      palette.classList.remove('palette--open');
      paletteInput.blur();
    }

    function filterOptions(query) {
      var q = query.toUpperCase();
      filteredItems = paletteItems.filter(function (item) {
        return item.label.indexOf(q) !== -1;
      });
      activeIndex = 0;
      renderOptions();
    }

    function renderOptions() {
      paletteOptions.innerHTML = '';
      filteredItems.forEach(function (item, i) {
        var div = document.createElement('div');
        div.className = 'palette__option' + (i === activeIndex ? ' palette__option--active' : '');
        div.textContent = item.label;
        div.addEventListener('click', function () {
          item.action();
          closePalette();
        });
        paletteOptions.appendChild(div);
      });
    }

    paletteInput.addEventListener('input', function () {
      filterOptions(paletteInput.value.trim());
    });

    paletteInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, filteredItems.length - 1);
        renderOptions();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        renderOptions();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[activeIndex]) {
          filteredItems[activeIndex].action();
          closePalette();
        }
      } else if (e.key === 'Escape') {
        closePalette();
      }
    });

    // Backdrop click closes palette
    palette.querySelector('.palette__backdrop').addEventListener('click', closePalette);

    // Keyboard shortcut to open
    document.addEventListener('keydown', function (e) {
      if (palette.classList.contains('palette--open')) return;
      var tag = document.activeElement && document.activeElement.tagName;
      var isInput = tag === 'INPUT' || tag === 'TEXTAREA';

      if ((e.key === '/' && !isInput) || (e.key === 'k' && (e.ctrlKey || e.metaKey))) {
        e.preventDefault();
        openPalette();
      }
    });
  }

  /* ================================================
     INTERACTIVE DOT GRID
     ================================================ */
  var dotCanvas = document.getElementById('dot-grid');
  var dotHero = document.querySelector('.hero');

  if (dotCanvas && dotHero && !prefersReduced) {
    var dCtx = dotCanvas.getContext('2d');
    var dots = [];
    var dotSpacing = 35;
    var dotRadius = 1.5;
    var dotMouseX = -1000;
    var dotMouseY = -1000;
    var dotRepelRadius = 100;
    var dotRepelStrength = 25;
    var dotEasing = 0.06;

    function initDots() {
      dotCanvas.width = dotHero.offsetWidth;
      dotCanvas.height = dotHero.offsetHeight;
      dots = [];
      var cols = Math.floor(dotCanvas.width / dotSpacing);
      var rows = Math.floor(dotCanvas.height / dotSpacing);
      var offsetX = (dotCanvas.width - cols * dotSpacing) / 2;
      var offsetY = (dotCanvas.height - rows * dotSpacing) / 2;

      for (var r = 0; r <= rows; r++) {
        for (var c = 0; c <= cols; c++) {
          var ox = offsetX + c * dotSpacing;
          var oy = offsetY + r * dotSpacing;
          dots.push({ ox: ox, oy: oy, x: ox, y: oy });
        }
      }
    }

    initDots();
    window.addEventListener('resize', initDots);

    dotHero.addEventListener('mousemove', function (e) {
      var rect = dotCanvas.getBoundingClientRect();
      dotMouseX = e.clientX - rect.left;
      dotMouseY = e.clientY - rect.top;
    });

    dotHero.addEventListener('mouseleave', function () {
      dotMouseX = -1000;
      dotMouseY = -1000;
    });

    function drawDots() {
      dCtx.clearRect(0, 0, dotCanvas.width, dotCanvas.height);

      for (var i = 0; i < dots.length; i++) {
        var dot = dots[i];
        var dx = dot.ox - dotMouseX;
        var dy = dot.oy - dotMouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < dotRepelRadius) {
          var force = (1 - dist / dotRepelRadius) * dotRepelStrength;
          var angle = Math.atan2(dy, dx);
          var targetX = dot.ox + Math.cos(angle) * force;
          var targetY = dot.oy + Math.sin(angle) * force;
          dot.x += (targetX - dot.x) * 0.2;
          dot.y += (targetY - dot.y) * 0.2;
        } else {
          dot.x += (dot.ox - dot.x) * dotEasing;
          dot.y += (dot.oy - dot.y) * dotEasing;
        }

        // Dots glow brighter when displaced
        var displacement = Math.sqrt(
          (dot.x - dot.ox) * (dot.x - dot.ox) +
          (dot.y - dot.oy) * (dot.y - dot.oy)
        );
        var alpha = 0.12 + Math.min(displacement / 12, 0.7);

        dCtx.beginPath();
        dCtx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        dCtx.fillStyle = 'rgba(255, 0, 0, ' + alpha + ')';
        dCtx.fill();
      }

      requestAnimationFrame(drawDots);
    }

    drawDots();
  }

  /* ================================================
     PARALLAX SCROLLING
     ================================================ */
  if (!prefersReduced && !isTouch) {
    var parallaxEls = document.querySelectorAll('[data-parallax]');
    var heroSection = document.querySelector('.hero');

    if (parallaxEls.length) {
      window.addEventListener('scroll', function () {
        var scrollY = window.scrollY;
        var heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 600;

        if (scrollY < heroBottom) {
          parallaxEls.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
            var yOffset = -(scrollY * speed);
            el.style.transform = 'translateY(' + yOffset + 'px)';
          });
        }
      }, { passive: true });
    }
  }

  // Terminal keypress sounds
  var termInputForSound = document.getElementById('terminal-input');
  if (termInputForSound) {
    termInputForSound.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        playEnterTone();
      } else if (e.key.length === 1) {
        playKeyClick();
      }
    });
  }

  // Button hover sounds
  var allButtons = document.querySelectorAll('.btn, button');
  allButtons.forEach(function (b) {
    b.addEventListener('mouseenter', function () {
      playHoverTone();
    });
  });

  /* ================================================
     SCROLL-LINKED ANIMATIONS
     ================================================ */
  if (!prefersReduced) {
    var projectCards = document.querySelectorAll('.project');
    var sectionHeaders = document.querySelectorAll('.section__header');
    var marqueeEl = document.querySelector('.marquee');

    function getScrollProgress(el) {
      var rect = el.getBoundingClientRect();
      var windowH = window.innerHeight;
      // 0 = element just entered viewport at bottom, 1 = element at top
      var progress = 1 - (rect.top / windowH);
      return Math.max(0, Math.min(1, progress));
    }

    function onScrollLinked() {
      // Project cards: slide in from left based on scroll position
      projectCards.forEach(function (card) {
        var progress = getScrollProgress(card);
        if (progress > 0.1 && progress < 1.2) {
          var slideX = Math.max(0, (1 - ((progress - 0.1) / 0.4)) * 30);
          var fadeIn = Math.min(1, (progress - 0.1) / 0.3);
          card.style.opacity = fadeIn;
          card.style.transform = 'translateX(' + slideX + 'px)';
        }
      });

      // Section headers: horizontal slide with fade
      sectionHeaders.forEach(function (header) {
        var progress = getScrollProgress(header);
        if (progress > 0 && progress < 1.2) {
          var slideX = Math.max(0, (1 - (progress / 0.5)) * 40);
          var fadeIn = Math.min(1, progress / 0.35);
          header.style.opacity = fadeIn;
          header.style.transform = 'translateX(-' + slideX + 'px)';
        }
      });

    }

    window.addEventListener('scroll', onScrollLinked, { passive: true });
    onScrollLinked();
  }

  /* ================================================
     DISCORD LIVE STATUS (Lanyard WebSocket)
     ================================================ */
  var DISCORD_USER_ID = '321284718035468288';
  var discordEls = {
    avatar: document.getElementById('discord-avatar'),
    statusDot: document.getElementById('discord-status-dot'),
    username: document.getElementById('discord-username'),
    statusText: document.getElementById('discord-status-text'),
    activityWrap: document.getElementById('discord-activity'),
    activityName: document.getElementById('discord-activity-name'),
    activityDetail: document.getElementById('discord-activity-detail')
  };

  function updateDiscordUI(d) {
    if (!d || !discordEls.avatar) return;
    var user = d.discord_user;

    // Avatar
    if (user && user.avatar) {
      var newSrc = 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar + '.png?size=128';
      if (discordEls.avatar.src !== newSrc) discordEls.avatar.src = newSrc;
    }

    // Username
    if (discordEls.username && user) {
      discordEls.username.textContent = '@' + (user.username || 'WAAEUW').toUpperCase();
    }

    // Status dot
    var status = d.discord_status || 'offline';
    discordEls.statusDot.className = 'profile-card__status-dot profile-card__status-dot--' + status;

    // Status text
    if (discordEls.statusText) {
      discordEls.statusText.textContent = status.toUpperCase();
    }

    // Activity
    if (d.activities && d.activities.length > 0 && discordEls.activityWrap) {
      var activity = null;
      for (var i = 0; i < d.activities.length; i++) {
        if (d.activities[i].type !== 4) {
          activity = d.activities[i];
          break;
        }
      }
      if (activity) {
        discordEls.activityWrap.style.display = '';
        if (discordEls.activityName) discordEls.activityName.textContent = activity.name.toUpperCase();
        if (discordEls.activityDetail) {
          discordEls.activityDetail.textContent = (activity.details || activity.state || '').toUpperCase();
        }
      } else {
        discordEls.activityWrap.style.display = 'none';
      }
    } else if (discordEls.activityWrap) {
      discordEls.activityWrap.style.display = 'none';
    }
  }

  function connectLanyardWS() {
    if (!discordEls.avatar || !discordEls.statusDot) return;
    var ws = new WebSocket('wss://api.lanyard.rest/socket');
    var heartbeatInterval = null;

    ws.onmessage = function (event) {
      var msg = JSON.parse(event.data);

      // op 1: Hello — start heartbeat and subscribe
      if (msg.op === 1) {
        heartbeatInterval = setInterval(function () {
          ws.send(JSON.stringify({ op: 3 }));
        }, msg.d.heartbeat_interval);

        ws.send(JSON.stringify({
          op: 2,
          d: { subscribe_to_id: DISCORD_USER_ID }
        }));
      }

      // op 0: Event — initial state or presence update
      if (msg.op === 0) {
        updateDiscordUI(msg.d);
      }
    };

    ws.onclose = function () {
      clearInterval(heartbeatInterval);
      // Reconnect after 5 seconds
      setTimeout(connectLanyardWS, 5000);
    };

    ws.onerror = function () {
      ws.close();
    };
  }

  connectLanyardWS();

  /* ================================================
     ROBLOX AVATAR REFRESH
     ================================================ */
  (function () {
    var robloxAvatar = document.getElementById('roblox-avatar');
    if (!robloxAvatar) return;

    robloxAvatar.onerror = function () {
      this.style.display = 'none';
    };

    fetch('https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=192243380&size=150x150&format=Png&isCircular=false')
      .then(function (res) { return res.json(); })
      .then(function (json) {
        if (json.data && json.data[0] && json.data[0].imageUrl) {
          robloxAvatar.src = json.data[0].imageUrl;
        }
      })
      .catch(function () {
        // CORS blocked — keep hardcoded CDN URL
      });
  })();

  /* ================================================
     MAGNETIC BUTTONS
     ================================================ */
  if (!isTouch && !prefersReduced) {
    var btns = document.querySelectorAll('.btn');
    btns.forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;
        var dx = e.clientX - centerX;
        var dy = e.clientY - centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          var pull = 0.3;
          btn.style.transform = 'translate(' + (dx * pull) + 'px, ' + (dy * pull) + 'px)';
        }
      });

      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ================================================
     CURSOR PARTICLE TRAIL
     ================================================ */
  if (cursorDot && !isTouch && !prefersReduced) {
    var particleCount = 0;
    var maxParticles = 30;
    var lastParticleTime = 0;

    document.addEventListener('mousemove', function (e) {
      var now = Date.now();
      if (now - lastParticleTime < 30) return;
      if (particleCount >= maxParticles) return;
      lastParticleTime = now;

      var particle = document.createElement('div');
      particle.className = 'cursor-particle';
      var offsetX = (Math.random() - 0.5) * 8;
      var offsetY = (Math.random() - 0.5) * 8;
      particle.style.left = (e.clientX - 2.5 + offsetX) + 'px';
      particle.style.top = (e.clientY - 2.5 + offsetY) + 'px';
      document.body.appendChild(particle);
      particleCount++;

      setTimeout(function () {
        particle.remove();
        particleCount--;
      }, 400);
    });
  }

  /* ================================================
     STAGGERED LETTER ANIMATION — "AVAILABLE FOR COMMISSIONS"
     ================================================ */
  var availableEl = document.querySelector('.contact__available');

  if (availableEl && !prefersReduced) {
    var availableText = availableEl.textContent;
    availableEl.innerHTML = '';

    availableText.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.className = 'letter';
      if (ch === ' ') {
        span.innerHTML = '&nbsp;';
      } else {
        span.textContent = ch;
      }
      availableEl.appendChild(span);
    });

    if ('IntersectionObserver' in window) {
      var letterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var letters = entry.target.querySelectorAll('.letter');
            letters.forEach(function (letter, i) {
              setTimeout(function () {
                letter.classList.add('letter-visible');
              }, i * 25);
            });
            letterObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      letterObserver.observe(availableEl);
    }
  } else if (availableEl) {
    // Reduced motion: show immediately
    var spans = availableEl.querySelectorAll('.letter');
    if (spans.length) {
      spans.forEach(function (s) { s.classList.add('letter-visible'); });
    }
  }

  /* ================================================
     ABOUT TEXT DECRYPT EFFECT
     ================================================ */
  var aboutSection = document.querySelector('.about');
  var aboutParagraphs = document.querySelectorAll('.about__content p');

  if (aboutParagraphs.length && aboutSection && !prefersReduced) {
    var decryptChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/*_&#@$%';
    var aboutData = [];
    var aboutDecrypted = false;

    aboutParagraphs.forEach(function (p) {
      aboutData.push({ el: p, text: p.textContent });
    });

    function runAboutDecrypt() {
      if (aboutDecrypted) return;

      // If about section is already visible (was revealed during boot), use an IntersectionObserver
      // to wait until the user actually scrolls to it
      var aboutDecryptObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !aboutDecrypted) {
            aboutDecrypted = true;
            aboutDecryptObserver.disconnect();

            aboutData.forEach(function (data) {
              // Scramble all text first
              data.el.textContent = data.text.split('').map(function (ch) {
                if (ch === ' ' || ch === '.' || ch === ',') return ch;
                return decryptChars[Math.floor(Math.random() * decryptChars.length)];
              }).join('');

              // Then decrypt left-to-right
              var text = data.text;
              var totalFrames = 30;
              var frame = 0;

              var decryptInterval = setInterval(function () {
                data.el.textContent = text.split('').map(function (ch, i) {
                  if (ch === ' ' || ch === '.' || ch === ',') return ch;
                  var revealPoint = (i / text.length) * totalFrames;
                  if (frame >= revealPoint) return ch;
                  return decryptChars[Math.floor(Math.random() * decryptChars.length)];
                }).join('');
                frame++;

                if (frame > totalFrames) {
                  clearInterval(decryptInterval);
                  data.el.textContent = text;
                }
              }, 30);
            });
          }
        });
      }, { threshold: 0.3 });

      aboutDecryptObserver.observe(aboutSection);
    }

    // Wait until boot sequence is done before setting up the decrypt
    if (document.body.classList.contains('boot-active')) {
      var bootMO = new MutationObserver(function () {
        if (!document.body.classList.contains('boot-active')) {
          bootMO.disconnect();
          runAboutDecrypt();
        }
      });
      bootMO.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } else {
      runAboutDecrypt();
    }
  }
});
