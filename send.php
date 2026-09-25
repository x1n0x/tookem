<?php
// Приём заявки из формы на главной (#requestForm) и отправка на почту.
// Отвечает JSON: {"ok": true} или {"ok": false, "error": "..."}.
// Если что-то пошло не так, script.js сам предложит отправить заявку в WhatsApp.

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const MAIL_TO   = 'info@tookem.kz';
const MAIL_FROM = 'noreply@tookem.kz';

function reply(bool $ok, string $error = '', int $code = 200): void {
    http_response_code($code);
    echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(false, 'Метод не поддерживается', 405);
}

// Ловушка для ботов: поле скрыто от людей, заполняют его только спам-скрипты.
// Отвечаем «успехом», чтобы бот не пробовал снова.
if (!empty($_POST['website'])) {
    reply(true);
}

function field(string $name, int $max): string {
    $value = trim((string)($_POST[$name] ?? ''));
    return function_exists('mb_substr') ? mb_substr($value, 0, $max, 'UTF-8') : substr($value, 0, $max);
}

$name    = field('name', 150);
$contact = field('contact', 150);
$message = field('message', 5000);

if ($name === '' || $contact === '' || $message === '') {
    reply(false, 'Заполните все поля', 422);
}

// Переводы строк в полях заголовков письма недопустимы
$name    = str_replace(["\r", "\n"], ' ', $name);
$contact = str_replace(["\r", "\n"], ' ', $contact);

$body = "Заявка с сайта tookem.kz\n\n"
      . "Имя / компания: {$name}\n"
      . "Контакт: {$contact}\n\n"
      . "Задача:\n{$message}\n\n"
      . '— ' . date('d.m.Y H:i') . ', IP ' . ($_SERVER['REMOTE_ADDR'] ?? '?') . "\n";

$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';

$headers = [
    'From: =?UTF-8?B?' . base64_encode('Сайт tookem.kz') . '?= <' . MAIL_FROM . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
];
// Если клиент оставил почту — «Ответить» в почтовике сразу пойдёт ему
if (filter_var($contact, FILTER_VALIDATE_EMAIL)) {
    $headers[] = 'Reply-To: ' . $contact;
}

$sent = mail(MAIL_TO, $subject, $body, implode("\r\n", $headers), '-f' . MAIL_FROM);

$sent ? reply(true) : reply(false, 'Не удалось отправить письмо', 500);
