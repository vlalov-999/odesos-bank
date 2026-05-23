/* ============================================================
   charts.js - чертае двете диаграми като SVG с JavaScript.
   1) Кръгова (donut): каква част е главница и каква лихва.
   2) Линейна: как намалява остатъкът по кредита във времето.
   Диаграмите се пречертават при всяка промяна на данните.
   ============================================================ */

(function () {
  'use strict';

  // SVG елементите се създават с този namespace
  var NS = 'http://www.w3.org/2000/svg';

  // Помощна функция: създава SVG елемент и му задава атрибути
  function el(name, attrs) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) {
      e.setAttribute(k, attrs[k]);
    }
    return e;
  }

  // Форматира число като сума в евро (например 12 345 EUR)
  function money(n) {
    return new Intl.NumberFormat('bg-BG', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' EUR';
  }

  /* ---------- 1) Кръгова (donut) диаграма ---------- */
  function donut(container, principal, interest) {
    container.innerHTML = ''; // изчистваме старата диаграма
    var total = principal + interest;
    if (total <= 0) return;

    // Размери и радиус на кръга
    var size = 220, cx = 110, cy = 110, r = 80, sw = 26;
    var circumference = 2 * Math.PI * r;       // обиколка на кръга
    var principalPart = principal / total;     // дял на главницата (0 до 1)

    var svg = el('svg', { viewBox: '0 0 ' + size + ' ' + size, role: 'img' });
    svg.setAttribute('aria-label', 'Кръгова диаграма: главница ' + money(principal) + ', лихва ' + money(interest));

    // Сив пръстен (основа)
    svg.appendChild(el('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: '#e8eff0', 'stroke-width': sw }));

    // Цял пръстен в пясъчен цвят = лихвата
    svg.appendChild(el('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: '#e8c58a', 'stroke-width': sw,
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    }));

    // Дъга в зелено отгоре = главницата
    // stroke-dasharray показва само частта, която отговаря на главницата
    svg.appendChild(el('circle', {
      cx: cx, cy: cy, r: r, fill: 'none', stroke: '#0e7c7b', 'stroke-width': sw,
      'stroke-dasharray': (principalPart * circumference) + ' ' + circumference,
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    }));

    // Текст в средата: процент лихва
    var percent = el('text', { x: cx, y: cy - 2, 'text-anchor': 'middle', 'font-size': '30', 'font-weight': '700', fill: '#0a2e3d', 'font-family': 'Poppins, sans-serif' });
    percent.textContent = Math.round((interest / total) * 100) + '%';
    var caption = el('text', { x: cx, y: cy + 20, 'text-anchor': 'middle', 'font-size': '13', fill: '#5a737c', 'font-family': 'Poppins, sans-serif' });
    caption.textContent = 'лихва';
    svg.appendChild(percent);
    svg.appendChild(caption);

    container.appendChild(svg);
  }

  /* ---------- 2) Линейна диаграма (остатък във времето) ---------- */
  function balanceChart(container, balances) {
    container.innerHTML = '';
    if (!balances || balances.length < 2) return;

    // Размери на чертожното поле и отстъпи
    var W = 360, H = 220, padL = 16, padR = 16, padT = 14, padB = 28;
    var innerW = W - padL - padR;
    var innerH = H - padT - padB;
    var maxValue = balances[0] || 1;   // най-голямата стойност = началната сума
    var n = balances.length - 1;       // брой месеци

    // Преобразуване от месец/сума в координати x/y
    function toX(i) { return padL + (i / n) * innerW; }
    function toY(v) { return padT + (1 - v / maxValue) * innerH; }

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img' });
    svg.setAttribute('aria-label', 'Линейна диаграма на намаляващия остатък по кредита');

    // Хоризонтални помощни линии
    for (var g = 0; g <= 4; g++) {
      var gy = padT + (g / 4) * innerH;
      svg.appendChild(el('line', { x1: padL, y1: gy, x2: W - padR, y2: gy, stroke: '#e8eff0', 'stroke-width': 1 }));
    }

    // Изграждаме пътя на линията през всички точки
    var linePath = '';
    for (var i = 0; i < balances.length; i++) {
      linePath += (i === 0 ? 'M' : 'L') + toX(i).toFixed(1) + ' ' + toY(balances[i]).toFixed(1) + ' ';
    }
    // Площта под линията (затворен път до долния ръб)
    var areaPath = linePath + 'L' + toX(n).toFixed(1) + ' ' + (padT + innerH) + ' L' + padL + ' ' + (padT + innerH) + ' Z';

    svg.appendChild(el('path', { d: areaPath, fill: '#21d4d4', 'fill-opacity': '0.15' }));
    svg.appendChild(el('path', { d: linePath, fill: 'none', stroke: '#0e7c7b', 'stroke-width': 2.5 }));

    // Надписи по хоризонталната ос (начало и край)
    var startLabel = el('text', { x: padL, y: H - 8, 'font-size': '11', fill: '#5a737c', 'font-family': 'Poppins, sans-serif' });
    startLabel.textContent = '0';
    var endLabel = el('text', { x: W - padR, y: H - 8, 'text-anchor': 'end', 'font-size': '11', fill: '#5a737c', 'font-family': 'Poppins, sans-serif' });
    endLabel.textContent = n + ' мес.';
    svg.appendChild(startLabel);
    svg.appendChild(endLabel);

    container.appendChild(svg);
  }

  // Публичен интерфейс
  window.Charts = { donut: donut, balanceChart: balanceChart };
})();
