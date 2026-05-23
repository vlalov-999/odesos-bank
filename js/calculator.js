/* ============================================================
   calculator.js - основната логика на кредитния калкулатор.
   Чете входните данни, изчислява погасителния план,
   показва резултатите, диаграмите и таблицата, и пази сценарии.
   Използва charts.js (диаграми) и storage.js (запазване).
   ============================================================ */

(function () {
  'use strict';

  // Кратка функция за намиране на елемент по id
  function $(id) { return document.getElementById(id); }

  // Форматиране на суми в евро
  function money(n) {
    return new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 2 }).format(n) + ' EUR';
  }
  function money0(n) {
    return new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' EUR';
  }

  /* ---------- Изчисляване на погасителния план ----------
     P          - размер на заема (главница)
     annualPct  - годишен лихвен процент
     nMonths    - срок в месеци
     type       - 'annuity' (анюитет) или 'declining' (намаляващи)
     lump       - еднократна допълнителна сума
     lumpMonth  - на кой месец се внася еднократната сума
     monthly    - месечно надвнасяне
  --------------------------------------------------------- */
  function compute(P, annualPct, nMonths, type, lump, lumpMonth, monthly) {
    var r = annualPct / 100 / 12;   // месечен лихвен процент
    var rows = [];                  // редовете на таблицата
    var balances = [P];             // остатъкът след всеки месец (за графиката)
    var balance = P, totalPaid = 0, totalInterest = 0;

    // Месечна анюитетна вноска по формулата от спецификацията
    var M;
    if (type === 'annuity') {
      M = (r === 0) ? P / nMonths
        : P * r * Math.pow(1 + r, nMonths) / (Math.pow(1 + r, nMonths) - 1);
    }
    var basePrincipal = P / nMonths;  // постоянна главница при намаляващите вноски

    var m = 0;
    var safetyCap = nMonths * 3 + 12; // предпазен лимит срещу безкраен цикъл

    // Повтаряме всеки месец, докато изплатим целия заем
    while (balance > 0.005 && m < safetyCap) {
      m++;
      var interest = balance * r; // лихвата за месеца се смята върху остатъка

      // Колко главница се покрива от редовната вноска
      var principalPart = (type === 'annuity') ? Math.max(M - interest, 0) : basePrincipal;

      // Добавяме предсрочното погасяване (месечно + еднократно за този месец)
      var extra = monthly + (m === lumpMonth ? lump : 0);
      var paidPrincipal = principalPart + extra;
      if (paidPrincipal > balance) paidPrincipal = balance; // да не платим повече от дължимото

      var payment = interest + paidPrincipal;
      balance = balance - paidPrincipal;

      totalPaid += payment;
      totalInterest += interest;

      rows.push({ m: m, payment: payment, interest: interest, principal: paidPrincipal, balance: Math.max(balance, 0), prepay: extra > 0 });
      balances.push(Math.max(balance, 0));
    }

    return { rows: rows, balances: balances, totalPaid: totalPaid, totalInterest: totalInterest, months: m, scheduled: M, principal: P };
  }

  // Чете всички полета от формата
  function readInputs() {
    var checked = document.querySelector('input[name="ptype"]:checked');
    return {
      amount: parseFloat($('amount').value) || 0,
      rate: parseFloat($('rate').value) || 0,
      years: parseFloat($('years').value) || 1,
      type: checked ? checked.value : 'annuity',
      lump: parseFloat($('prepayLump').value) || 0,
      lumpMonth: parseInt($('prepayMonth').value, 10) || 1,
      monthly: parseFloat($('prepayMonthly').value) || 0
    };
  }

  /* ---------- Обновяване на резултатите на екрана ---------- */
  function render() {
    var v = readInputs();
    var nMonths = Math.round(v.years * 12);
    if (v.amount <= 0 || nMonths <= 0) return;

    // Изчисляваме избрания сценарий
    var res = compute(v.amount, v.rate, nMonths, v.type, v.lump, v.lumpMonth, v.monthly);

    // Ако има предсрочно погасяване, смятаме и базов сценарий без него,
    // за да покажем колко лихва е спестена
    var hasPrepay = v.lump > 0 || v.monthly > 0;
    var base = hasPrepay ? compute(v.amount, v.rate, nMonths, v.type, 0, 1, 0) : res;
    var savedInterest = base.totalInterest - res.totalInterest;

    // Текст за месечната вноска
    var firstPay = res.rows[0] ? res.rows[0].payment : 0;
    var lastPay = res.rows[res.rows.length - 1] ? res.rows[res.rows.length - 1].payment : 0;
    var paymentText = (v.type === 'annuity')
      ? money(res.scheduled)
      : money0(firstPay) + ' -> ' + money0(lastPay); // при намаляващи: първа и последна

    // Попълваме четирите обобщаващи стойности
    $('mPayment').textContent = paymentText;
    $('mTotal').textContent = money0(res.totalPaid);
    $('mInterest').textContent = money0(res.totalInterest);
    $('mTerm').textContent = res.months + ' мес.';

    // Бележка за спестената лихва
    var note = $('savedNote');
    if (note) {
      if (hasPrepay && savedInterest > 1) {
        note.style.display = 'block';
        note.textContent = 'С предсрочното погасяване спестявате ' + money0(savedInterest) +
          ' лихва и съкращавате срока с ' + (base.months - res.months) + ' месеца.';
      } else {
        note.style.display = 'none';
      }
    }

    // Чертаем диаграмите
    window.Charts.donut($('donut'), res.principal, res.totalInterest);
    window.Charts.balanceChart($('lineChart'), res.balances);

    // Попълваме таблицата
    renderTable(res.rows);
  }

  // Създаване на редовете на таблицата с погасителния план
  function renderTable(rows) {
    var tbody = $('scheduleBody');
    tbody.innerHTML = '';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      var tr = document.createElement('tr');
      if (r.prepay) tr.className = 'prepay'; // оцветяваме реда с предсрочно погасяване
      tr.innerHTML =
        '<td>' + r.m + '</td>' +
        '<td>' + money0(r.payment) + '</td>' +
        '<td>' + money0(r.interest) + '</td>' +
        '<td>' + money0(r.principal) + '</td>' +
        '<td>' + money0(r.balance) + '</td>';
      tbody.appendChild(tr);
    }
  }

  // Свързва числово поле с плъзгач - при промяна на едното се мени и другото
  function link(numberId, rangeId) {
    var number = $(numberId);
    var range = $(rangeId);
    if (!number || !range) return;
    number.addEventListener('input', function () { range.value = number.value; render(); });
    range.addEventListener('input', function () { number.value = range.value; render(); });
  }

  /* ---------- Запазени сценарии  ---------- */

  // Показване на списъка със запазените сценарии
  function renderSaved() {
    var box = $('savedList');
    if (!box) return;

    if (!window.Storage.supported()) {
      box.innerHTML = '<p class="hint">Браузърът не поддържа съхранение.</p>';
      return;
    }

    var items = window.Storage.list();
    if (items.length === 0) {
      box.innerHTML = '<p class="hint">Няма запазени сценарии.</p>';
      return;
    }

    box.innerHTML = '';
    items.forEach(function (s) {
      var row = document.createElement('div');
      row.className = 'saved-row';
      row.innerHTML = '<span>' + escapeHtml(s.name) + '<small>' +
        money0(s.params.amount) + ', ' + s.params.rate + '%, ' + s.params.years + ' г.</small></span>';

      // Бутон "Зареди"
      var loadBtn = document.createElement('button');
      loadBtn.type = 'button';
      loadBtn.className = 'btn btn-soft';
      loadBtn.textContent = 'Зареди';
      loadBtn.addEventListener('click', function () { applyScenario(s.params); });

      // Бутон "Изтрий"
      var delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'link-del';
      delBtn.setAttribute('aria-label', 'Изтрий сценария');
      delBtn.textContent = 'x';
      delBtn.addEventListener('click', function () { window.Storage.remove(s.id); renderSaved(); });

      row.appendChild(loadBtn);
      row.appendChild(delBtn);
      box.appendChild(row);
    });
  }

  // Зарежда запазен сценарий обратно във формата
  function applyScenario(p) {
    $('amount').value = p.amount; $('amountRange').value = p.amount;
    $('rate').value = p.rate; $('rateRange').value = p.rate;
    $('years').value = p.years; $('yearsRange').value = p.years;
    var radio = document.querySelector('input[name="ptype"][value="' + p.type + '"]');
    if (radio) radio.checked = true;
    $('prepayLump').value = p.lump || 0;
    $('prepayMonth').value = p.lumpMonth || 1;
    $('prepayMonthly').value = p.monthly || 0;
    render();
    window.scrollTo(0, 0);
  }

  // Обезопасяване на текста за вмъкване в HTML
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------- Стартиране при зареждане на страницата ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    if (!$('amount')) return; // не сме на страницата на калкулатора

    // Свързваме трите двойки число + плъзгач
    link('amount', 'amountRange');
    link('rate', 'rateRange');
    link('years', 'yearsRange');

    // Преизчисляваме при смяна на схемата
    var radios = document.querySelectorAll('input[name="ptype"]');
    for (var i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', render);
    }

    // Преизчисляваме при промяна на предсрочното погасяване
    ['prepayLump', 'prepayMonth', 'prepayMonthly'].forEach(function (id) {
      var e = $(id);
      if (e) e.addEventListener('input', render);
    });

    // Бутон за запазване на сценарий
    $('saveBtn').addEventListener('click', function () {
      var name = ($('scenarioName').value || '').trim() || 'Сценарий';
      window.Storage.save(name, readInputs());
      $('scenarioName').value = '';
      renderSaved();
    });

    // Инициализиране на първоначалното състояние
    render();
    renderSaved();
  });
})();
