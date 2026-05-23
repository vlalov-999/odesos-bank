/* ============================================================
   storage.js - запазване на сценарии в браузъра чрез
   HTML5 Local Storage (тема от Лекция 5).
   Данните остават след затваряне на браузъра.
   ============================================================ */

(function () {
  'use strict';

  // Ключът, под който пазим всички сценарии в localStorage
  var KEY = 'odesos_scenarios';

  // Проверка дали браузърът поддържа Local Storage
  function supported() {
    try {
      return typeof window.localStorage !== 'undefined';
    } catch (e) {
      return false;
    }
  }

  // Прочита всички запазени сценарии и ги връща като масив
  function readAll() {
    if (!supported()) return [];
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  // Записва целия масив обратно в localStorage
  function writeAll(list) {
    if (!supported()) return false;
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
      return true;
    } catch (e) {
      return false;
    }
  }

  // Публичен интерфейс - другите файлове ползват window.Storage
  window.Storage = {
    supported: supported,
    list: readAll,

    // Добавя нов сценарий с име и параметри
    save: function (name, params) {
      var list = readAll();
      list.push({ id: Date.now(), name: name, params: params });
      return writeAll(list);
    },

    // Изтрива сценарий по неговото id
    remove: function (id) {
      var filtered = readAll().filter(function (s) { return s.id !== id; });
      writeAll(filtered);
    }
  };
})();
