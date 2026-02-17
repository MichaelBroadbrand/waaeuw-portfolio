document.addEventListener('DOMContentLoaded', function () {
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

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
      about: 'WAAEUW — Roblox developer. ~1yr scripting on Roblox, 3+ years programming. Gameplay systems, data persistence, UI, networking. Available for commissions.'
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
});
