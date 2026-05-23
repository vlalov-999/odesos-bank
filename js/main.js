/* ============================================================
   main.js - споделен скрипт за всички страници.
   Отговаря за отварянето и затварянето на мобилното меню.
   ============================================================ */

// Изчакваме HTML-а да се зареди, преди да търсим елементите
document.addEventListener('DOMContentLoaded', function () {

  // Намираме бутона "хамбургер" и списъка с връзки
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');

  // Ако ги няма на тази страница, спираме
  if (!toggle || !links) return;

  // При клик върху бутона показваме/скриваме менюто (класът .open)
  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    // обновяваме aria-expanded за достъпност
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // При клик върху връзка затваряме менюто
  var allLinks = links.querySelectorAll('a');
  for (var i = 0; i < allLinks.length; i++) {
    allLinks[i].addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
});
