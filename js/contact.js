/* ============================================================
   contact.js - проверява (валидира) контактната форма.
   Понеже няма сървър, при успех само показваме съобщение.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('contactForm');
  if (!form) return; // ако не сме на страницата с формата

  var status = document.getElementById('formStatus');

  // Показва или скрива съобщение за грешка под дадено поле
  function setError(fieldId, message) {
    var box = document.getElementById('err-' + fieldId);
    if (box) box.textContent = message || '';
    return !message; // връща true, ако няма грешка
  }

  // При натискане на бутона "Изпрати"
  form.addEventListener('submit', function (event) {
    event.preventDefault(); // спираме реалното изпращане (няма сървър)

    var name = document.getElementById('cf-name');
    var email = document.getElementById('cf-email');
    var phone = document.getElementById('cf-phone');
    var message = document.getElementById('cf-msg');

    var valid = true;

    // Името трябва да е поне 2 символа
    if (!setError('name', name.value.trim().length < 2 ? 'Моля, въведете име.' : '')) valid = false;

    // Имейлът трябва да съдържа @ и точка
    if (!setError('email', !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value) ? 'Невалиден имейл адрес.' : '')) valid = false;

    // Телефонът е по избор, но ако е попълнен - проверяваме формата
    if (!setError('phone', phone.value && !/^[0-9+()\s-]{6,}$/.test(phone.value) ? 'Невалиден телефонен номер.' : '')) valid = false;

    // Съобщението трябва да е поне 10 символа
    if (!setError('msg', message.value.trim().length < 10 ? 'Съобщението е твърде кратко (минимум 10 символа).' : '')) valid = false;

    // Резултат
    if (valid) {
      status.textContent = 'Благодарим! Съобщението е изпратено успешно (демонстрация).';
      status.className = 'form-status ok';
      form.reset();
    } else {
      status.textContent = 'Моля, поправете отбелязаните полета.';
      status.className = 'form-status';
    }
  });
});
